angular.module("d3jsapp")
.controller('WorldcupController', ['$scope', 'Team', '$timeout', '$log', function ($scope, Team, $timeout, $log) {
    
    // Define size of the graph
    var svg = d3.select(".team_chart"),
        color = d3.scale.category10(),
        width = 700,
        height = 500,
        x_offset = 100,
        y_offset = 50;
    
    Team.then(function (data) {
        $log.debug("[WorldcupController] team data loaded");
        // $scope.teams = data;
        drawFlags(data);
        drawCircle(data);
        $log.debug("[WorldcupController] draw completed");
    })
    
    function randomize () {
        return function (d) {
            var targetX = width / 2;
            var targetY = height / 2;
            d.x += (targetX - d.x) * 0.1;
            d.y += (targetY - d.y) * 0.1;
        }
    }
    
    function totalLayout(force) {
        // Generate the effect that centralize bubbles in the center of the canvas
        force
            .gravity(2)
            .friction(0.4)
            .on("tick", function(e) {
                svg.selectAll("circle")
                .each(randomize())
                .attr("cx", function(d) { return d.x + x_offset; })
                .attr("cy", function(d) { return d.y + y_offset; });
            })
            .start();
        
        for (var i=0; i<100; i++) force.tick();
        
        $timeout(function () {
            force.stop();
            force
                .gravity(0.6) //0.6
                .friction(0.2) // 0.2
            .on("tick", function(e){
                svg.selectAll("circle")
                .attr("cx", function(d) { return d.x + x_offset; })
                .attr("cy", function(d) { return d.y + y_offset; });
            }).start();
        }, 700);
        
    }
    
    var flag_orig = {};
    function drawFlags(data) {
        var flags = [];
        angular.forEach(data, function (d) {
            flags.push({ team_name: d.team_name, flag_class: d.flag_class }); 
        });
        
        var grid = d3.layout.grid()
            .bands()
            .nodeSize([4, 8])
            .rows(1)
            .cols(32)
            .padding([22, 17]);
        
        var flagNodes = grid(flags);
        
        var team_flags = d3.select("#team_flags");
        
        team_flags
            .selectAll("span")
            .data(flagNodes)
            .enter()
            .append("div")
            .attr("class", function (d) {
                return "flagsp " + d.flag_class;
            })
            .attr("style", function (d) {
                var pos = "top: " + d.y + "px; left: " + d.x + "px;";
                flag_orig[d.flag_class] = pos;
                return pos;
            })
        ;
        
    }
    
    
    // OnMouseHover bubble effect
    
    function circleMouseOver (d, i) {
        var flag = d3.select("." + d.flag_class),
            circle = d3.select(this);
        flag
            .transition()
            .duration(500)
            .attr("style", "top: " + circle.attr("cy") + "px; left: " + circle.attr("cx") + "px;");
    }
    // OnMouseOut bubble effect
    function circleMouseOut (d, i) {
        var flag_class = d.flag_class,
            flag = d3.select("." + flag_class);
        flag
            .transition()
            .duration(500)
            .attr("style", flag_orig[flag_class]);
        
    }
    
    
    
    
    function drawCircle(data) {
        var maxRanking = d3.max(data, function (d) { return d.fifa_rank }),
            rankingX = d3.scale.linear()
                .domain([maxRanking+10, 0])
                .range([0, 50]);

        var force = d3.layout.force()
            .gravity(0.8)
            .friction(0.3)
            .charge(function (d) {
                // Negative multiple of radius
                return rankingX(d.fifa_rank) * -120;
            })
            .nodes(data)
            .size([width, height]);
        force.start();
        
        
        
        var circles = svg.selectAll("circle");
        circles
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function(d) { return d.x + x_offset; })
            .attr("cy", function(d) { return d.y + y_offset; })
            .attr("r", function (d) {
                // Ranking should be the area of the circle
                // return Math.sqrt(rankingX(d.fifa_rank)/Math.PI)
                return rankingX(d.fifa_rank)
            })
            .attr("class", "team")
            .attr("fill", function (d) {
                return color(d.team_group);
            })
            .on("mouseover", circleMouseOver)
            .on("mouseout", circleMouseOut)
            .append("title")
            .text(function (d) {
                return d.team_name;
            })
        ;
        
        totalLayout(force);
    }
    
    
    
    
    
}]);