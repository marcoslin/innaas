(function () {
    var app = angular.module("d3jsapp"),
        gapi_macro_id = "AKfycbzPmX1lskGdRXPFv51nNFETNuahsYs8qR1MJs2l_V5aGEE8eQ8K",
        gapi_sheet_id = "0AkUnplOj51vKdFVQbmQ1ZDVuakNmZjh6Y1VBMUg5bXc",
        gapi_url = "https://script.google.com/macros/s/" + gapi_macro_id + "/exec?id=" + gapi_sheet_id + "&sheet="
    
    app.factory('Team', ['$http', '$q', '$log', function ($http, $q, $log) {
        var d = $q.defer(),
            url = gapi_url + "team&callback=JSON_CALLBACK";
        
        $http.jsonp(url)
            .success(function (data, status) {
                $log.log("jsonp.status: ", status);
                d.resolve(data.team);
            })
            .error(function (data, status) {
                $log.error("Team jsonp call failed: ", data);
                d.reject(data);
            });
        
        return d.promise;
    }]);
})();

