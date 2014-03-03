angular.module("d3jsapp")
.controller('WorldcupController', ['$scope', 'Team', '$timeout', '$log', function ($scope, Team, $timeout, $log) {
    
    // Define size of the graph
    var circle_canvas_width = 950,  // From style.css
        circle_canvas_height = 550, // From style.css
        color = d3.scale.category10(),
        team_data, team_group_data = [],
        max_fifa_rank_rel = 0, min_fifa_rank_rel = 0,
        circles;
    
    Team.then(function (data) {
        $log.debug("[WorldcupController] team data loaded");
        // Store the data
        team_data = data;
        
        // Create data for displaying team flag
        var team_flag_data = [],
            team_groups = {};
        
        angular.forEach(data, function (d) {
            team_flag_data.push({
                team_name: d.team_name,
                team_code: d.fifa_code.toUpperCase(),
                team_idclass: d.team_idclass,
                circle_idclass: d.circle_idclass,
                flag_class: d.flag_class
            });
            // Create team data
            if ( !team_groups[d.team_group] ) {
                team_groups[d.team_group] = true;
            }
            // Set min/max fifa_rank_rel
            if (d.fifa_rank_rel > max_fifa_rank_rel) max_fifa_rank_rel = d.fifa_rank_rel;
            if (d.fifa_rank_rel < min_fifa_rank_rel) min_fifa_rank_rel = d.fifa_rank_rel;
            
        });
        team_group_data = d3.keys(team_groups);
                
        // Start drawing
        drawTeams(team_flag_data);
        drawAxis();
        drawCircle(data);
        //$scope.showAxis();
        $log.debug("[WorldcupController] draw completed");
    })
    
    
    /** 
     * TEAM SECTION
     */
    var team_orig_position = {};
    function teamMouseOver(d, i) {
        var idclass = d.circle_idclass,
            circle = d3.select("#" + idclass);
        circle.classed("highlight", true);
    }
    function teamMouseOut(d, i) {
        var idclass = d.circle_idclass,
            circle = d3.select("#" + idclass);
        circle.classed("highlight", false);
    }
    function drawTeams(data) {
        var grid = d3.layout.grid()
            .bands()
            .nodeSize([4, 8])
            .rows(2)
            .cols(16)
            .padding([55, 17]);
        
        var team_flags = d3.select("#flag-canvas"),
            team_flag = team_flags
                .selectAll("div")
                .data(grid(data))
                .enter()
                .append("div")
                .attr("class", "team")
                .attr("title", function (d) { return d.team_name; })
                .attr("id", function (d) { return d.team_idclass; })
                .attr("style", function (d) {
                    var pos = "top: " + d.y + "px; left: " + d.x + "px;"
                    // Store original position
                    team_orig_position[d.team_idclass] = pos;
                    return pos;
                })
                .on("mouseover", teamMouseOver)
                .on("mouseout", teamMouseOut)
        ;
        
        team_flag
            .append("span")
            .attr("class", function (d) {
                return "flagsp " + d.flag_class;
            });
        
        team_flag
            .append("span")
            .attr("class", "team-code")
            .text(function (d) {
                return d.team_code;
            })
        ;
        
    }
    
    /** 
     * CIRCLE SECTION
     */
    function randomize () {
        return function (d) {
            var targetX = circle_canvas_width / 2;
            var targetY = circle_canvas_height / 2;
            d.x += (targetX - d.x) * 0.1;
            d.y += (targetY - d.y) * 0.1;
        }
    }
    
    function totalLayout(team_chart, force) {
        // Generate the effect that centralize bubbles in the center of the canvas
        force
            .gravity(2)
            .friction(0.4)
            .on("tick", function(e) {
                team_chart.selectAll("circle")
                .each(randomize())
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
            })
            .start();
        
        for (var i=0; i<100; i++) force.tick();
        
        $timeout(function () {
            force.stop();
            force
                .gravity(0.6) //0.6
                .friction(0.2) // 0.2
            .on("tick", function(e){
                team_chart.selectAll("circle")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
            }).start();
        }, 700);
        
    }
    
    // OnMouseHover bubble effect
    function circleMouseOver (d, i) {
        var id_name = d.team_idclass,
            circle = d3.select(this),
            x = circle.attr("cx"),
            y = circle.attr("cy");
        
        d3.select("#" + id_name)
            .transition()
            .duration(500)
            .attr("style", "top: " + y + "px; left: " + x + "px;");
    }
    // OnMouseOut bubble effect
    function circleMouseOut (d, i) {
        var id_name = d.team_idclass;
        
        d3.select("#" + id_name)
            .transition()
            .duration(500)
            .attr("style", team_orig_position[id_name]);
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
            .size([circle_canvas_width, circle_canvas_height]);
        force.start();

        var team_chart = d3.select("#team-chart")
            .append("g")
            .attr("id", "circles");
        
        circles = team_chart.selectAll("circle");

        circles
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", function (d) {
                // Ranking should be the area of the circle
                // return Math.sqrt(rankingX(d.fifa_rank)/Math.PI)
                return rankingX(d.fifa_rank)
            })
            .attr("id", function (d) { return d.circle_idclass; })
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
        
        totalLayout(team_chart, force);
    }
    
    /** 
     * AXIS Section
     */
    var priv_showAxis = false;
    $scope.showAxis = function () {
        var axis = d3.selectAll(".axis");
        priv_showAxis = !priv_showAxis;
        axis.classed("show", priv_showAxis);
        
        // Redraw the circles
        var margin = { top: 20, left: 50 },
            width = circle_canvas_width - margin.left,
            height = circle_canvas_height - margin.top;

        var x = d3.scale.ordinal()
            .domain(team_group_data)
            .rangeBands([0, width])
        ;
        
        var y = d3.scale.linear()
            .domain([min_fifa_rank_rel, max_fifa_rank_rel])
            .range([height, 0])
        ;
        
        d3.select("#circles")
            .selectAll("circle")
            .data(team_data)
            .transition()
            .attr("cx", function(d) {
                var new_x = x(d.team_group) + margin.left * 2 + 6;
                $log.log("new_x: " + new_x + "; for ", this);
                return new_x;
            })
            .attr("cy", function(d) { return y(d.fifa_rank_rel) - 20; })
        ;
        
    };
    
    
    function drawAxis() {
        $log.log("Axis called.");
        var margin = { top: 20, left: 50 },
            width = circle_canvas_width - margin.left,
            height = circle_canvas_height - margin.top;
        
        var x = d3.scale.ordinal()
            .domain(team_group_data)
            .rangeBands([0, width])
        ;
        
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickValues(team_group_data)
            .tickSize(-height)
        ;
        
        var y = d3.scale.linear()
            .domain([min_fifa_rank_rel, max_fifa_rank_rel])
            .range([height, 0]);
        
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5)
            .tickSize(-width);
        
        var axis_g = d3.select("#team-chart")
            .append("g")
            .attr("transform", "translate(" + margin.left + ",-" + margin.top + ")")
        ;

        axis_g
            .append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("id", "xaxis")    
            .attr("class", "axis")
            .call(xAxis)
        ;
        
        axis_g
            .append("g")
            .attr("id", "yaxis")
            .attr("class", "y axis")
            .call(yAxis)
        ;
    }
    
    
}]);