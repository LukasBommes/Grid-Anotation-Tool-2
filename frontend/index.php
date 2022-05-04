<?php

require_once 'route.php';

$route = new Route();

$route->add('/', function() {
    echo 'This is the home page, there is no template engine';
});

$route->listen();