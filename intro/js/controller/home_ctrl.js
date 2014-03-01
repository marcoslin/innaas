var app = angular.module("d3jsapp");

app.controller('HomeController', ['$scope', '$log', function ($scope, $log) {
    
    // Define data
    var init_data = [
        { country: "Brazil", score: 40 },
        { country: "Italy", score: 10 },
        { country: "USA", score: 80 },
    ];

    var width = 1000,
        barHeight = 20;
    
    var x = d3.scale.linear()
        .range([0, width])
        .domain([0, 80]);
    
    var chart = d3.select(".chart")
        .attr("width", width);
    
    var gs = chart.selectAll("g");
    
    var counter = 0;
    function updateChart(data) {
        //x.domain([0, d3.max(data, function(d) { return d.value; })]);

        // chart.attr("height", barHeight * data.length);
        
        var barUpdate = gs.data(data);
        
        var barEnter = barUpdate.enter().append("g");
        
        barEnter.attr("transform", function(d, i) {
            var entry = counter + i;
            $log.log("transform d:", d, "; entry:", entry);
            return "translate(0," + entry * barHeight + ")";
        });
        
        barEnter.append("rect")
            .attr("width", function(d) { return x(d.score); })
            .attr("height", barHeight - 1);
        
        barEnter.append("text")
            .attr("x", function(d) { return x(d.score) - 3; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .text(function(d) { return d.score; });
        
        counter += data.length;
        chart.attr("height", barHeight * counter);
    };

    $scope.addData = function () {
        var model = [{ country: $scope.country, score: $scope.score }];
        updateChart(model);
        $log.log("model added: ", model);
    };
    
    updateChart(init_data);

}]);
