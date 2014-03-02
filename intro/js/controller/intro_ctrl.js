angular.module("d3jsapp")


/**
 * INTRO1
 */
.controller('Intro1Controller', ['$scope', '$log', function ($scope, $log) {
    
    // Define data
    var init_data = [
        { country: "Brazil", score: 40 }
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
        
        /*
        barEnter.append("text")
            .attr("text-anchor", "start")
            .attr("x", 30)
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .text(function(d) { return d.country; });
        */
        
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

}])


/**
 * INTRO2
 */
.controller('Intro2Controller', ['$scope', '$log', function ($scope, $log) {
    var diameter = 800,
        format = d3.format(",d"),
        color = d3.scale.category20c();
    
    var bubble = d3.layout.pack()
        .sort(null)
        //.size([diameter, diameter])
        .size([diameter, diameter])
        .padding(1.5);
    
    var svg = d3.select(".chart")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");
    
    d3.json("data/flare.json", function(error, root) {
      var node = svg.selectAll(".node")
          .data(bubble.nodes(classes(root))
          .filter(function(d) { return !d.children; }))
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    
        $log.log("classes: ", classes(root));
        
      node.append("title")
          .text(function(d) { return d.className + ": " + format(d.value); });
    
      node.append("circle")
          .attr("r", function(d) { return d.r; })
          .style("fill", function(d) { return color(d.packageName); });
    
      node.append("text")
          .attr("dy", ".3em")
          .style("text-anchor", "middle")
          .text(function(d) { return d.className.substring(0, d.r / 3); });
    });
    
    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function classes(root) {
      var classes = [];
    
      function recurse(name, node) {
        if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
        else classes.push({packageName: name, className: node.name, value: node.size});
      }
    
      recurse(null, root);
      return {children: classes};
    }
    
    d3.select(self.frameElement).style("height", diameter + "px");
    
}]);