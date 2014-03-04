(function () {

    var app = angular.module("d3jsapp", ['ngRoute']);

    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/home', { templateUrl: "views/home.html", controller: "HomeController"} )
            .when('/intro1', { templateUrl: "views/intro1.html", controller: "Intro1Controller"} )
            .when('/intro2', { templateUrl: "views/intro2.html", controller: "Intro2Controller"} )
            .when('/worldcup', { templateUrl: "views/worldcup.html", controller: "WorldcupController"} )
            .otherwise({redirectTo: '/home'})
        ;
    }]);

})();

