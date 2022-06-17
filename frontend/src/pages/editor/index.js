import './style.css';

import * as d3 from "d3";
import { SvgShapes, Intersection, Point2D, Vector2D } from "kld-intersections";
import { MDCList } from '@material/list';
import { MDCSnackbar } from '@material/snackbar';

import { apiService } from '../../api.js';
import { 
  entrypoint,
	getAnnotationIds,
	redirectToLogin,
	uuidv4,
	htmlToElements,
	setupProjectClicked,
	exportProjectClicked,
	getImageUrl,
} from '../../utils.js';


  // TODO:
  // - display project info (name, number of images, number of annotated images, last edited, created, description, etc.)
  const annotation_saved_success_msg = "Annotation saved.";
  const annotation_saved_error_msg = "Failed to save annotation.";

  const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
  const imagesSelectionList = new MDCList(document.getElementById('images-selection-list'));
  imagesSelectionList.singleSelection = true;

  entrypoint(() => {
    editor(project_id);
  });

  async function editor(project_id) {
    var selected_image = {"id": null, "name": null};
    var selected_image_has_changes = false;
    var existing_anotations = [];
    var img_width, img_height;
    var marker_mode = "auxline"
    var img_pos_x, img_pos_y;

    var prev_intersections = [];
    var auxlines = [];
    var auxcurves = [];
    var temp_auxline_pts = [];
    var temp_auxcurve_pts = [];

    var neighbour_corners;
    var neighbours_manual_selection = [];
    var selected_pv_module = "";
    var corners = [];
    var pv_modules = [];

    document.getElementById("export-project-button").addEventListener('click', exportProjectClicked.bind(null, project_id));
    document.getElementById("setup-project-button").addEventListener('click', setupProjectClicked.bind(null, project_id));

    async function getImages(project_id) {
        var response = await apiService.getImages(project_id);

        if (response.status == 200) {
            const data = await response.json();
            data.forEach(function(image) {
              addImageToImagesList(image);
              const annotated = existing_anotations.includes(image.id);
              setImageAnnotationStatus(image.id, annotated);
            });
        } else if (response.status == 401) {
            redirectToLogin();
        } else {
            throw new Error(`Failed to get images`);
        }
    }

    async function getAnnotation(image_id) {
        var response = await apiService.getAnnotation(image_id);

        if (response.status == 200) {
            const data = await response.json();
            if ('data' in data) {
              var neededKeys = ['corners', 'grid_cells', 'auxlines', 'auxcurves', 'prev_intersections'];
              if (neededKeys.every(key => Object.keys(data.data).includes(key))) {
                  corners = data.data.corners;
                  pv_modules = data.data.grid_cells;
                  auxlines = data.data.auxlines;
                  auxcurves = data.data.auxcurves;
                  prev_intersections = data.data.prev_intersections;
                  draw();
              }
            }
        } else if (response.status == 401) {
            redirectToLogin();
        } else {
            throw new Error(`Failed to get annotation for image with id ${image_id}`);
        }
    }

    async function updateAnnotation(image_id, annotation_data) {
        var response = await apiService.updateAnnotation(image_id, annotation_data);

        if (response.status == 200) {
          console.log(annotation_saved_success_msg);
          snackbar.labelText = annotation_saved_success_msg;
          snackbar.open();
        } else if (response.status == 401) {
          redirectToLogin();
        } else {
          console.log(annotation_saved_error_msg);
          snackbar.labelText = annotation_saved_error_msg;
          snackbar.open();
          throw new Error(`Failed to save annotation`);
        }
    }

    // helper to remove extension from filename
    function splitext(filename) {
      return filename.split('.').slice(0, -1).join('.')
    }

    function addImageToImagesList(image) {
        const html_list_item = `
          <li id="images-selection-list-${image.id}" data-image-id="${image.id}" data-image-name="${image.name}" class="mdc-deprecated-list-item" role="option">
            <span class="mdc-deprecated-list-item__ripple"></span>
            <span class="mdc-deprecated-list-item__text">${splitext(image.name).slice(0, 8)}</span>
            <span class="mdc-deprecated-list-item__meta">
              <i class="material-icons menu-icon" style="color:green; visibility: hidden;">check</i>
            </span>
          </li>`;
        document.getElementById('images-selection-list').appendChild(htmlToElements(html_list_item));
    }

    function setImageAnnotationStatus(image_id, annotated) {
      const listElement = document.getElementById(`images-selection-list-${image_id}`);
      var icon = listElement.querySelector('.menu-icon');
      if (annotated) {        
        icon.style.visibility = "visible";
      } else {
        icon.style.visibility = "hidden";
      }
    }

    existing_anotations = await getAnnotationIds();
    getImages(project_id);

    // saves annotation data to file
    function save() {
      if (selected_image_has_changes) {
        if (selected_image["name"] != null && (pv_modules.length > 0 || corners.length > 0 ||
            auxlines.length > 0 || auxcurves.length > 0)) {
        //if (selected_image["name"] != null) {    // with thisline simply changing the selection will save annotations
            save_to_json(selected_image["id"]);
            setImageAnnotationStatus(selected_image["id"], true);
        }
        selected_image_has_changes = false;
      }
    }

    window.addEventListener('beforeunload', (event) => {
      event.preventDefault();
      save();
      console.log("Saved annotation before reload.");
    });

    function reset_objects() {
      temp_auxline_pts = [];
      temp_auxcurve_pts = [];
      neighbours_manual_selection = [];
    }

    var remove_active_tag = function(buttons_drawing) {
      var btns_other = buttons_drawing.querySelectorAll("button");
      for (var i = 0; i < btns_other.length; i++) {
        btns_other[i].classList.remove("btn-active")
      }
    };

    function selected_image_changed() {
      selected_image_has_changes = true;
    }

    function images_selection_changed(event) {
      // save annotations of previous image before changing the image
      save();

      // clear SVG and annotations when changing image
      svg.selectAll('*').remove();
      reset_objects();
      auxlines = [];
      auxcurves = [];
      prev_intersections = [];
      corners = [];
      pv_modules = [];
      marker_mode = "auxline";
      selected_pv_module = "";

      // when changing image mark the auxline button as active
      remove_active_tag(buttons_drawing);
      document.getElementById("btn-draw-auxline").classList.add("btn-active")

      var g_element = svg.append("g")
          .attr("id", "g_element");

      var image_element = svg.select("#g_element")
          .append('image');

      // set image
      const selectedListIdx = imagesSelectionList.selectedIndex;
      selected_image = {
        id: event.target.children[selectedListIdx].dataset.imageId,
        name: event.target.children[selectedListIdx].dataset.imageName
      }

      const image_id = selected_image["id"];
      getImageUrl(image_id).then(imageURL => {
        image_element.attr('href', imageURL);
      });      

      // image zoom and translation
      var zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);
      function zoom_actions(event){
        g_element.attr("transform", event.transform);
      }
      zoom_handler(svg);

      // determine image dimensions
      var img = new Image();
      img.onload = function(){
        img_width = img.width;
        img_height = img.height;
        console.log("Changed image:", img.width, img.height);

        // center the image in the svg
        var svg_width = Number(svg.style("width").replace("px", ""));
        var svg_height = Number(svg.style("height").replace("px", ""));
        var img_offset_x = svg_width/2 - img_width/2;
        var img_offset_y = svg_height/2 - img_height/2;
        var initial_transform = d3.zoomIdentity.translate(img_offset_x, img_offset_y);
        svg.call(zoom_handler.transform, initial_transform);
      }
      getImageUrl(image_id).then(imageURL => {
        img.src = imageURL;
      });

      // add lines connecting the center cursor with the nearest four corners
      for (var i = 0; i < 4; i++) {
      svg.select("#g_element")
        .append("line")
          .attr("id", "center-line-"+[i])
          .style("stroke", "magenta")
          .style("stroke-dasharray", ("2, 2"))
          .style("stroke-width", 0.5)
          .style("stroke-opacity", 0);
      }

      // maintain previous cursor state when changing to another image
      svg.select("#g_element")
        .append("g")
        .append("circle")
          .attr("id", "cursor")
          .attr('r', 2)
          .style("fill", "magenta")
          .style("opacity", 0)
          .style("fill-opacity", 1)
          .style("stroke", null);

      // we need these two groups to maintain a consistent z ordering of corners and modules
      svg.select("#g_element")
        .append("g")
          .attr("id", "g_auxobjects");
      svg.select("#g_element")
        .append("g")
          .attr("id", "g_pv_modules");
      svg.select("#g_element")
        .append("g")
          .attr("id", "g_corners");

      // check if annotation exist for the selected image and load it
      if (selected_image["id"] !== null) {
        getAnnotation(selected_image["id"]);
      }
    }
    document.getElementById('images-selection-list').addEventListener("MDCList:selectionChange", images_selection_changed);

    var svg = d3.select('svg');

    // parse translation and scale from the image transform
    function getTranslationScale(g_element) {
      var matrix = g_element.transform.baseVal.consolidate().matrix;
      var img_offset_x = matrix.e;
      var img_offset_y = matrix.f;
      var img_scale = matrix.d;
      return [img_offset_x, img_offset_y, img_scale];
    }

    // get the current position of the cursor in the image coordinate system
    svg.on("mousemove", (event) => {
        var mouse = d3.pointer(event);  // acces mouse position via mouse[0], mouse[1]
        if (!d3.select("#g_element").empty()) {
          var [img_offset_x, img_offset_y, img_scale] = getTranslationScale(g_element);

          // transform mouse cooridnates to image coordinates
          img_pos_x = (mouse[0] - img_offset_x) / img_scale
          img_pos_y = (mouse[1] - img_offset_y) / img_scale

          // draw cursor
          svg.select("#cursor")
            .attr("cx", img_pos_x)
            .attr('cy', img_pos_y);

          // make center connection lines invisible
          for (var i = 0; i < 4; i++) {
            svg.select("#center-line-"+[i])
              .style("stroke-opacity", 0);
          }

          // find four nearest neighbouring corners when in center mode
          var findKNearest = function(point, corners, k) {
            var distances = [];
            for (var i = 0; i < corners.length; i++) {
              var dist = Math.pow((corners[i].x - point.x), 2) + Math.pow((corners[i].y - point.y), 2);
              distances.push({'dist': dist, 'corner': corners[i]});
            }
            var distances_sorted = distances.sort(function(a, b) { return a.dist > b.dist ? 1 : -1});
            var neighbours = distances_sorted.slice(0, k);
            return neighbours;
          }

          // find neighbours and draw lines connecting the center cursor with the corners
          if (corners.length > 0 && marker_mode == "center") {
            neighbour_corners = findKNearest({x: img_pos_x, y: img_pos_y}, corners, 4);
            // draw supporting geometry for center point placement
            for (var i = 0; i < neighbour_corners.length; i++) {
              svg.select("#center-line-"+[i])
                .attr("x1", img_pos_x)
                .attr("y1", img_pos_y)
                .attr("x2", neighbour_corners[i].corner.x)
                .attr("y2", neighbour_corners[i].corner.y)
                .style("stroke-opacity", 1);
            }
          }
        }
    });

    // show cursor when entering the svg
    svg.on("mouseover", function () {
      svg.select("#cursor").style("opacity", 1);
      // make center connection lines visible
      if (marker_mode == "center") {
        for (var i = 0; i < 4; i++) {
          svg.select("#center-line-"+[i])
            .style("stroke-opacity", 1);
        }
      }
    });

    // hide cursor when leaving the SVG
    svg.on("mouseout", function () {
      svg.select("#cursor").style("opacity", 0);
      // make center connection lines invisible
      if (marker_mode == "center") {
        for (var i = 0; i < 4; i++) {
          svg.select("#center-line-"+[i])
            .style("stroke-opacity", 0);
        }
      }
    });

    // handle click of drawing mode button actions
    var buttons_drawing = document.getElementById('drawing-actions');
    var button_drawing_click = function(e) {
      remove_active_tag(buttons_drawing);
      reset_objects();
      selected_pv_module = "";
      draw();
      var btn = e.target;
      if (btn.id == 'btn-add-corner') {
        marker_mode = "corner";
        btn.classList.add("btn-active");
        // change cursor
        svg.select("#cursor")
          .style("fill", "magenta")
          .style("fill-opacity", 1)
          .style("stroke", null);
        console.log("Switched to corner mode");
      } else if (btn.id == 'btn-create-module') {
        marker_mode = "center";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill", "black")
          .style("fill-opacity", 1)
          .style("stroke", null);
        console.log("Switched to center mode");
      } else if (btn.id == 'btn-create-module-manual') {
        marker_mode = "center_manual";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill-opacity", 0)
          .style("stroke", null);
        console.log("Switched to center mode (manual)");
      } else if (btn.id == 'btn-erase') {
        marker_mode = "erase";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill", null)
          .style("fill-opacity", 0)
          .style("stroke", "red")
          .style("stroke-width", 0.5);
        console.log("Switched to erase mode");
      } else if (btn.id == 'btn-draw-auxline') {
        marker_mode = "auxline";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill", "magenta")
          .style("fill-opacity", 1)
          .style("stroke", null);
        console.log("Switched to auxline mode");
      } else if (btn.id == 'btn-draw-auxcurve') {
        marker_mode = "auxcurve";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill", "magenta")
          .style("fill-opacity", 1)
          .style("stroke", null);
        console.log("Switched to auxcurve mode");
      } else if (btn.id == 'btn-get-intersects') {
        marker_mode = null;
        svg.select("#cursor")
          .style("fill-opacity", 0)
          .style("stroke", null);
        compute_intersections(prev_intersections);
        selected_image_changed();
        draw();
        console.log("Computed new corners as intersections of auxiliary lines.");
      } else if (btn.id == 'btn-mark-module-partially-visible') {
        marker_mode = "mark_module_partially_visible";
        btn.classList.add("btn-active");
        svg.select("#cursor")
          .style("fill-opacity", 0)
          .style("stroke", null);
      }
    };
    buttons_drawing.addEventListener('click', button_drawing_click, false);

    // place a new marker when clicking
    svg.on("click", function () {
      if (marker_mode == "corner") {
        corners.push({x: img_pos_x, y: img_pos_y, id: uuidv4()});
        console.log("Placed a new corner marker at (", img_pos_x, ",", img_pos_y, ")");
        selected_image_changed();
        draw();
      }
      else if (marker_mode == "center") {
        if (corners.length < 4) {
          alert("Before you can create a grid cell you need to place at least four corner markers first.");
        } else {
          // sort neighbouring corners ccw
          var neighbours = [];
          for (var i = 0; i < neighbour_corners.length; i++) {
            neighbours.push(neighbour_corners[i].corner);
          }
          neighbours = order_corners_ccw(neighbours);
          var center_point = compute_center_point(neighbours);
          // store the new pv module
          pv_modules.push({"corners": neighbours, "center": center_point, "id": uuidv4(), "truncated": false});
          console.log("Placed a new grid cell at (", center_point.x, ",", center_point.y, ")");
          selected_image_changed();
          draw();          
        }
      }
      else if (marker_mode == "auxline") {
        temp_auxline_pts.push({x: img_pos_x, y: img_pos_y});
        if (temp_auxline_pts.length == 2) {
          auxlines.push({
            x1: temp_auxline_pts[0].x,
            y1: temp_auxline_pts[0].y,
            x2: temp_auxline_pts[1].x,
            y2: temp_auxline_pts[1].y,
            id: uuidv4()
          });
          console.log("Placed auxiliary line from (", temp_auxline_pts[0].x, ",",
            temp_auxline_pts[0].y, ") to (", temp_auxline_pts[1].x, ",", temp_auxline_pts[1].y, ")");
          temp_auxline_pts = [];
          selected_image_changed();
          draw();
        }
      }
      else if (marker_mode == "auxcurve") {
        temp_auxcurve_pts.push([img_pos_x, img_pos_y]);
        if (temp_auxcurve_pts.length == 3) {
          auxcurves.push({points: temp_auxcurve_pts, id: uuidv4()});
          temp_auxcurve_pts = [];
          console.log("Placed auxiliary curve");
          selected_image_changed();
          draw();
        }
      }
    });
    // sorts four corners into [tr, tl, bl, br] order
    var order_corners_ccw = function(corners) {
      var corners_sorted = corners.sort(function(a, b) { return a.x > b.x ? 1 : -1});
      var corners_left = corners_sorted.slice(0, 2);
      var corners_right = corners_sorted.slice(2, 4);
      var corners_left_sorted = corners_left.sort(function(a, b) { return a.y > b.y ? 1 : -1});
      var tl = corners_left_sorted[0];
      var bl = corners_left_sorted[1];
      var corners_right_sorted = corners_right.sort(function(a, b) { return a.y > b.y ? 1 : -1});
      var tr = corners_right_sorted[0];
      var br = corners_right_sorted[1];
      return [tr, tl, bl, br];
    };
    // computes the center point given four corner points
    var compute_center_point = function(corners) {
      var center_point = {x: 0, y: 0};
      for (var i = 0; i < corners.length; i++) {
        center_point.x += corners[i].x;
        center_point.y += corners[i].y;
      }
      center_point.x /= corners.length;
      center_point.y /= corners.length;
      return center_point;
    };

    // find all pairwise intersections between auxiliary lines and curves
    function compute_intersections() {
      // find all intersections between two paths
      function intersect_paths(path0, path1) {
        function remove_duplicates(points) {
          return points.filter((a, b) => points.indexOf(a) === b);
        }
        var intersects = [];
        var overlays = Intersection.intersect(path0, path1); // intersectShapes
        for (i in overlays.points) {
            if (overlays.points[i] instanceof Vector2D || overlays.points[i] instanceof Point2D) {
            intersects.push({x: overlays.points[i].x, y: overlays.points[i].y});
          }
        }
        if (typeof intersects !== 'undefined') {
          return remove_duplicates(intersects);
        }
        else {
          return [];
        }
      }

      // determine which intersections were added, removed and kept from previous intersections
      function get_diff(prev_intersects, intersects) {
        var added = [], removed = [], kept = [];
        for (var i = 0; i < intersects.length; i++) {
          if (prev_intersects.some(function(d) { return d.x == intersects[i].x && d.y == intersects[i].y } )) {
            kept.push(intersects[i]);
          } else {
            added.push(intersects[i]);
          }
        }
        for (var i = 0; i < prev_intersects.length; i++) {
          if (!intersects.some(function(d) { return d.x == prev_intersects[i].x && d.y == prev_intersects[i].y } )) {
            removed.push(prev_intersects[i]);
          }
        }
        return [added, removed, kept];
      }

      var intersections = [];
      for(var k = 0; k < auxlines.length+auxcurves.length; k++) {
        for (var l = k + 1; l < auxlines.length+auxcurves.length; l++) {
          var aux_obj = [
            svg.selectAll(".auxobj").nodes()[k],
            svg.selectAll(".auxobj").nodes()[l]
          ]

          // create path objects (Line/Path) depending on whether the element is a line or curve
          var path = [];
          for (var i = 0; i < 2; i++) {
            if (aux_obj[i].classList.contains("auxline")) {
              path.push(SvgShapes.line(aux_obj[i]));
            } else if (aux_obj[i].classList.contains("auxcurve")) {
              path.push(SvgShapes.path(aux_obj[i]));
            }
          }
          // commpute intersection between path objects
          var intersects = intersect_paths(path[0], path[1]);
          intersections.push(...intersects);
        }
      }

      // find out which intersections have been added, kept or removed
      var [added, removed, kept] = get_diff(prev_intersections, intersections);
      prev_intersections = [...intersections];

      // add corners corresponding to the added intersections
      for (var i = 0; i < added.length; i++) {
        corners.push({x: added[i].x, y: added[i].y, id: uuidv4()});
      }
      // remove corners and all pv modules containing the corner
      for (var k = corners.length-1; k >= 0; k--) {
        if (removed.some(function(d) { return d.x == corners[k].x && d.y == corners[k].y })) {
          // if corner is part of a pv_module, delete the entire module
          var del_idx = [];
          for (var i = 0; i < pv_modules.length; i++) {
            for(var j = 0; j < pv_modules[i].corners.length; j++) {
              if (pv_modules[i].corners[j].id == corners[k].id) {
                del_idx.push(i);
              }
            }
          }
          for (var i = del_idx.length-1; i >= 0; i--) {
            console.log("Deleting grid cell " + pv_modules[i].id + "(it contained deleted point " + corners[k].id + ")");
            pv_modules.splice(del_idx[i], 1);
          }
          corners.splice(k, 1);
        }
      }
    }

    // manual creation of pv modules (by clicking 4 corners)
    function corner_mouseclick_handler(event, d) {
      console.log("corner_mouseclick_handler");
      if (marker_mode == "center_manual") {
        if (corners.length < 4) {
          alert("Before you can create a grid cell you need to place at least four corner markers first.");
        } else {
          neighbours_manual_selection.push(d)
          if (neighbours_manual_selection.length == 4) {
            neighbours_manual_selection = order_corners_ccw(neighbours_manual_selection);
            var center_point = compute_center_point(neighbours_manual_selection);
            // store the new pv module
            pv_modules.push({"corners": neighbours_manual_selection, "center": center_point, "id": uuidv4(), "truncated": false});
            console.log("Placed a new grid cell at (", center_point.x, ",", center_point.y, ")");
            neighbours_manual_selection = [];
            selected_image_changed();
            draw();
          }
        }

      }
    }

    // dragging of corner points
    function dragstarted(event, d) {
      d3.select(this).raise();
      svg.select("#g_element").attr("cursor", "grabbing");
    }
    function dragended(event, d) {
      svg.select("#g_element").attr("cursor", "default");
    }
    function dragged(event, d) {
      // update corner position
      d3.select(this).attr("cx", d.x = event.x).attr("cy", d.y = event.y);
      // update center position and corner position of all pv modules which contain the marker
      for (var i = 0; i < pv_modules.length; i++) {
        for (var j = 0; j < pv_modules[i].corners.length; j++) {
          if (pv_modules[i].corners[j].id == d.id) {
            pv_modules[i].corners[j] = d;
            pv_modules[i].center = compute_center_point(pv_modules[i].corners);
          }
        }
      }
      selected_image_changed();
      draw();
    }

    // draging of auxline endpoints
    function auxline_dragged(event, d) {
      // update line coordinates
      if (this.classList.contains("auxline-startpoint")) {
        d3.select(this.parentNode).select("line")
          .attr("x1", d.x1 = event.x)
          .attr("y1", d.y1 = event.y);
      } else if (this.classList.contains("auxline-endpoint")) {
        d3.select(this.parentNode).select("line")
          .attr("x2", d.x2 = event.x)
          .attr("y2", d.y2 = event.y);
      }
      // update line endpoint
      d3.select(this).attr("cx", d.cx = event.x).attr("cy", d.cy = event.y);
      selected_image_changed();
      draw();
    }

    // computes auxcurve path from three control points
    function generate_auxcurve_data(curve_points) {
      var line_generator = d3.line()
        .curve(d3.curveCatmullRom.alpha(1));
      var path_data = line_generator(curve_points);
      return path_data;
    }

    // draging of auxcurve endpoints
    function auxcurve_dragged(event, d) {
      // update curve points
      var element_id = d3.select(this.parentNode).attr("id");
      for (var i = 0; i < auxcurves.length; i++) {
        if (auxcurves[i].id == element_id) {
          if (this.classList.contains("auxcurve-startpoint")) {
            auxcurves[i].points[0][0] = event.x;
            auxcurves[i].points[0][1] = event.y;
          } else if (this.classList.contains("auxcurve-middlepoint")) {
            auxcurves[i].points[1][0] = event.x;
            auxcurves[i].points[1][1] = event.y;
          } else if (this.classList.contains("auxcurve-endpoint")) {
            auxcurves[i].points[2][0] = event.x;
            auxcurves[i].points[2][1] = event.y;
          }
          d3.select(this.parentNode).select("path").attr("d", generate_auxcurve_data(auxcurves[i].points));
        }
      }
      // update line point
      d3.select(this).attr("cx", event.x).attr("cy", event.y);
      selected_image_changed();
      draw();
    }

    // delete objects in erase mode
    var erase_mousedown_handler = function(event, d) {
      function erase_corner_marker(element) {
        d3.select(element).on('mousedown.drag', null);  // remove drag handler before deleting element
        var element_id = d3.select(element).attr("id");
        // search and remove element from the corners array
        for (var i = corners.length-1; i >= 0; i--) {
          if (corners[i].id == element_id) {
            // before deleting corner remove it from the previous intersections array
            for (var j = prev_intersections.length-1; j >= 0; j--) {
              if (prev_intersections[j].x == corners[i].x && prev_intersections[j].y == corners[i].y) {
                  prev_intersections.splice(j, 1);
              }
            }
            // delete corner
            console.log("Deleting corner " + element_id);
            corners.splice(i, 1);
          }
        }
        // if corner is part of a pv_module, delete the entire module
        var del_idx = [];
        for (var i = 0; i < pv_modules.length; i++) {
          for(var j = 0; j < pv_modules[i].corners.length; j++)
          {
            if (pv_modules[i].corners[j].id == element_id) {
              del_idx.push(i);
            }
          }
        }
        for (var i = del_idx.length-1; i >= 0; i--) {
          console.log("Deleting grid cell " + pv_modules[i].id + "(it contained deleted point " + element_id + ")");
          pv_modules.splice(del_idx[i], 1);
        }
      }

      function erase_auxline(element) {
        //d3.select(element).on('mousedown.drag', null);
        var element_id = d3.select(element.parentNode).attr("id");
        for (var i = auxlines.length-1; i >= 0; i--) {
          if (auxlines[i].id == element_id) {
            console.log("Deleting auxline " + element_id);
            auxlines.splice(i, 1);
          }
        }
      }

      function erase_auxcurve(element) {
        var element_id = d3.select(element.parentNode).attr("id");
        for (var i = auxcurves.length-1; i >= 0; i--) {
          if (auxcurves[i].id == element_id) {
            console.log("Deleting auxcurve " + element_id);
            auxcurves.splice(i, 1);
          }
        }
      }

      if (marker_mode == "erase") {
        if (this.classList.contains("corner_marker")) {
          erase_corner_marker(this);
        } else if (this.classList.contains("auxline-erase")) {
          erase_auxline(this);
        } else if (this.classList.contains("auxcurve-erase")) {
          erase_auxcurve(this);
        }
        selected_image_changed();
        draw();
      }
    };

    // selection of PV module with mouse
    var mark_module_partially_visible_handler = function(event, d) {
      if (marker_mode == "mark_module_partially_visible") {
        selected_pv_module = d.id;
        for (var i = 0; i < pv_modules.length; i++) {
          if (pv_modules[i]["id"] == selected_pv_module) {
            var truncated = pv_modules[i]["truncated"];
            pv_modules[i]["truncated"] = !truncated;
          }
        }
        selected_image_changed();
        draw();
        save();
      }
    };

    var draw = function() {
      // auxiliary lines
      var svg_auxlines = svg.select("#g_auxobjects")
        .selectAll(".auxline")
        .data(auxlines, d => d["id"]);
      var svg_auxlines_enter = svg_auxlines.enter().append("g")
        .attr("id", function (d) { return d.id });
      svg_auxlines_enter.append("line")
        .attr("class", "auxobj auxline auxline-erase")
        .attr("x1", function (d) { return d.x1 })
        .attr("y1", function (d) { return d.y1 })
        .attr("x2", function (d) { return d.x2 })
        .attr("y2", function (d) { return d.y2 })
        .style("stroke", "magenta")
        .style("stroke-opacity", 0.5)
        .style("stroke-width", 1)
        .on("mousedown", erase_mousedown_handler);
      svg_auxlines_enter.append("circle")
        .attr("class", "auxline-startpoint auxline-erase")
        .attr("cx", function (d) { return d.x1 })
        .attr("cy", function (d) { return d.y1 })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxline_dragged));
      svg_auxlines_enter.append("circle")
        .attr("class", "auxline-endpoint auxline-erase")
        .attr("cx", function (d) { return d.x2 })
        .attr("cy", function (d) { return d.y2 })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxline_dragged));
      var svg_auxlines_merged = svg_auxlines_enter.merge(svg_auxlines);
      var svg_auxlines_exit = svg_auxlines.exit().each(function() { d3.select(this.parentNode).remove(); });

      // auxiliary curves
      var svg_auxcurves = svg.select("#g_auxobjects")
        .selectAll(".auxcurve")
        .data(auxcurves, d => d["id"]);
      var svg_auxcurves_enter = svg_auxcurves.enter().append("g")
        .attr("id", function (d) { return d.id });
      svg_auxcurves_enter.append("path")
        .attr("class", "auxobj auxcurve auxcurve-erase")
        .attr("d", function (d) { return generate_auxcurve_data(d.points) })
        .style("stroke", "magenta")
        .style("fill", "none")
        .style("stroke-width", 1)
        .style("stroke-opacity", 0.5)
        .on("mousedown", erase_mousedown_handler);
      svg_auxcurves_enter.append("circle")
        .attr("class", "auxcurve-startpoint auxcurve-erase")
        .attr("cx", function (d) { return d.points[0][0] })
        .attr("cy", function (d) { return d.points[0][1] })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxcurve_dragged));
      svg_auxcurves_enter.append("circle")
        .attr("class", "auxcurve-middlepoint auxcurve-erase")
        .attr("cx", function (d) { return d.points[1][0] })
        .attr("cy", function (d) { return d.points[1][1] })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxcurve_dragged));
      svg_auxcurves_enter.append("circle")
        .attr("class", "auxcurve-endpoint auxcurve-erase")
        .attr("cx", function (d) { return d.points[2][0] })
        .attr("cy", function (d) { return d.points[2][1] })
        .style("r", 1.5)
        .style("fill", "magenta")
        .on("mousedown", erase_mousedown_handler)
        .call(d3.drag()
          .on("drag", auxcurve_dragged));
      var svg_auxcurves_merged = svg_auxcurves_enter.merge(svg_auxcurves);
      var svg_auxcurves_exit = svg_auxcurves.exit().each(function() { d3.select(this.parentNode).remove(); });

      // corner markers
      svg.select("#g_corners")
          .selectAll(".corner_marker")
          .data(corners)
          .join("circle")
            .attr("class", "corner_marker")
            .attr('id', function (d) { return d.id; })
            .attr('cx', function (d) { return d.x; })
            .attr('cy', function (d) { return d.y; })
            .attr('r', 2)
            .attr("fill", "magenta")
            .on("mousedown.1", erase_mousedown_handler)
            .on("mousedown.2", corner_mouseclick_handler)
            .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

      // pv modules
      svg.select("#g_pv_modules")
        .selectAll(".pv_module")
        .data(pv_modules)
        .join("polygon")
          .attr("class", "pv_module")
          .attr("id", function (d) { return d.id; })
          .attr("points", function (d) {
            return d.corners.map(function (d) { return [d.x, d.y].join(","); }).join(" "); })
          .style("fill", function (d) { if(d.truncated) {return "yellow"} else {return "lawngreen"}; })
          .style("fill-opacity", 0.5)
          .style("stroke", function (d) { if(d.truncated) {return "yellow"} else {return "lawngreen"}; })
          .style("stroke-width", 0.5)
          .on("mousedown", erase_mousedown_handler)
          .on("click", mark_module_partially_visible_handler);

      // center markers
      svg.select("#g_pv_modules")
        .selectAll(".pv_module_center")
        .data(pv_modules)
        .join("circle")
          .attr("class", "pv_module_center")
          .attr('cx', function (d) { return d.center.x })
          .attr('cy', function (d) { return d.center.y })
          .attr('r', 2)
          .attr("fill", "black");
    }

    // save annotations to JSON when changing the image
    async function save_to_json(image_id) {
      var annotation_data = {
          "data": {
            "image": selected_image["name"],
            "grid_cells": pv_modules,
            "corners": corners,
            "auxlines": auxlines,
            "auxcurves": auxcurves,
            "prev_intersections": prev_intersections
          }
      };

      await updateAnnotation(image_id, annotation_data);
    }
  }

  export { editor };