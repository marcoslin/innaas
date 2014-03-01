var app = angular.module("d3jsapp", ['ngRoute']);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/home', { templateUrl: "views/home.html", controller: "HomeController"} )
        .otherwise({redirectTo: '/home'})
    ;
}]);