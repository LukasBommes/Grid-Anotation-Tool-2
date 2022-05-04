import * as React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import grey from '@mui/material/colors/grey';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';
import { APIURL } from '../config.js'

// TODO:
// - get project id from router url
// - get list of images by project id
// - populate image selection list


const styles = {
    imageList: {
      minHeight: "150px",
      maxHeight: "150px",
      overflowY: "scroll",
    },
    listSubheader: {
      paddingLeft: 16,
      borderRadius: "unset",
    },
    selectedListItem: {
      backgroundColor: grey[300],
      '&:hover': {
        backgroundColor: grey[300],
      }
    },
    videogroupListItem: {
      opacity: "1.0 !important",
    },
    addButton: {
      minWidth: 0,
      padding: "3px",
    }
};


export default function Editor() {

    const [imageList, setImageList] = useState([]);
    const [selectedImageId, setSelectedImageId] = useState([]);

    const getImages = (project_id) => {
        axios
        .get(`${APIURL}/project/${project_id}/images/`)
        .then((res) => setImageList(res.data))
        .catch((err) => console.log(err));
    };

    const deleteImage = (image) => {
        axios
        .delete(`${APIURL}/image/${image.id}`)
        .then((res) => {
            var imageList_ = imageList.slice();
            imageList_ = imageList_.filter(function(obj) {
            return obj.id !== image.id;
            });
            setImageList(imageList_);
        })
        .catch((err) => console.log(err));
    }

    // handle change of video group upon selection by user
    const handleImageSelection = (imageId) => {
        console.log(imageId);
        setSelectedImageId(imageId);
    };

    useEffect(() => {
        getImages("1");
    });

    return (
        <div className="imageList">
            <List dense={true} subheader=
            <ListSubheader disableGutters={true}>
                <Paper elevation={0} className="listSubheader">
                Images
                <ListItemSecondaryAction>
                    <Tooltip title="Create New Video Group">
                    <Button
                        className="addButton"
                        variant="contained"
                        disableElevation
                        aria-label="create new video group"
                    >
                        <AddIcon />
                    </Button>
                    </Tooltip>
                </ListItemSecondaryAction>
                </Paper>
            </ListSubheader>
            >
            {imageList.map((image) => {
                const statusIcon = <CheckIcon className="checkIcon" />;
                const statusIndicator = <Typography variant="body2" color="textSecondary">
                                    Not annotated
                                  </Typography>;
                const className = (image.id === selectedImageId ? "selectedListItem" : "");

                return (
                    <ListItem button
                    key={image.id}
                    className={`videogroupListItem ${className}`}
                    onClick={() => handleImageSelection(image.id)}
                    >
                        <ListItemIcon>
                            {statusIcon}
                        </ListItemIcon>
                        <ListItemText
                            primary=<div>
                            {image.name.slice(7, 15)}
                            {statusIndicator}
                            </div>
                        />
                        <ListItemSecondaryAction>
                            <Tooltip title="Delete">
                            <IconButton edge="end" aria-label="delete"
                                onClick={() => deleteImage(image)}
                            >
                                <DeleteIcon />
                            </IconButton>
                            </Tooltip>
                        </ListItemSecondaryAction>
                    </ListItem>
                );
            })}
            </List>
        </div>
    );
}