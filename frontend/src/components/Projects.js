import * as React from 'react';
import {
    Link as RouterLink
  } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import InboxIcon from '@mui/icons-material/Inbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DeleteAlert from './DeleteAlert';
import { APIURL } from '../config.js'


class Projects extends React.Component {
    constructor(props) {
        super(props);
        this.state= {
            projectList: [],
            deleteAlertOpen: false,
            deleteProject: null,
        };
        this.handleDelete = this.handleDelete.bind(this);
        this.closeAlert = this.closeAlert.bind(this);
    }

    componentDidMount() {
        this.getProjects();
    }

    getProjects = () => {
        axios
        .get(`${APIURL}/projects/`)
        .then((res) => this.setState({projectList: res.data }))
        .catch((err) => console.log(err));
    };

    handleDelete(project) {
        this.setState({
            deleteAlertOpen: true,
            deleteProject: project,
        });
    }

    closeAlert() {
        this.setState({
            deleteAlertOpen: false,
            deleteProject: null,
        });
    };

    deleteProject(project) {
        this.closeAlert();
        axios
        .delete(`${APIURL}/projects/${project.id}/`)
        .then((res) => {
            var projectList = this.state.projectList.slice();
            projectList = projectList.filter(function(obj) {
            return obj.id !== project.id;
            });
            this.setState({projectList: projectList});
        })
        .catch((err) => console.log(err));
    }

    render() {
        return (
            <div>
                <List dense={true} subheader=
                    <ListSubheader disableGutters={true}>
                        <Paper elevation={0}>
                            Projects
                        </Paper>
                    </ListSubheader>
                >
                    {this.state.projectList.map((project) => {
                        const date = new Date(project.created);
                        const dateFormatted = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`
                        return (
                            <ListItem button
                                key={project.id}
                                component={RouterLink}
                                to={`/app/project?project_id=${project.id}`}
                            >
                                <ListItemAvatar>
                                <Avatar>
                                    {project.name.charAt(0)}
                                </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                primary={project.name}
                                secondary={`Added on ${dateFormatted}`}
                                />
                                <ListItemSecondaryAction>
                                <Tooltip title="Delete">
                                    <IconButton edge="end" aria-label="delete"
                                    onClick={() => this.handleDelete(project)}>
                                    <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit">
                                    <IconButton
                                    edge="end"
                                    aria-label="edit"
                                    component={RouterLink}
                                    to={`/app/project?project_id=${project.id}`}
                                    >
                                    <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })}
                </List>

                <DeleteAlert
                    title={"Delete project?"}
                    text={`You are about to delete project ${this.state.deleteProject
                    ? this.state.deleteProject.name : ""}.
                    This will also permantely delete all uploaded videos, intermediate
                    data and results of this project. Are you sure you want to
                    continue?`}
                    open={this.state.deleteAlertOpen}
                    handleClose={this.closeAlert}
                    handleDelete={() => this.deleteProject(this.state.deleteProject)}
                />
            </div>
        );
    }
}


export default Projects;