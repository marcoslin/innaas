/**
ToDo:
1. Add mouse over
2. Why the reset of circles when circleForce is called twice in sequence?
*/

angular.module("d3jsapp")
.controller('WorldcupController', ['$scope', 'Team', 'Layout', '$timeout', '$log', function ($scope, Team, Layout, $timeout, $log) {
    // Create the 3 svg group needed
    var svg = d3.select("#container")
            .append("svg"),
        flag_group = d3.select("#flag-group"),
        axis_group = svg.append("g")
            .attr("id", "axis-group"),
        circle_group = svg.append("g")
            .attr("id", "circle-group")
    ;   
    
    
    // Load/initialize data
    var team_data;

    Team.then(function (data) {
        $log.debug("[WorldcupController] team data loaded");
        
        Layout.initialize(
            data,
            // Canvas based on #container from style.css
            { width: 950, height: 600 },
            // Margin
            { left: 50, top: 50, right: 50, bottom: 50}
        );
          
        // Start drawing
        initializeAxis();
        initializeFlag(data);
        initializeCircle(data);
        
        // Default Layout
        Layout.flagGrid();
        Layout.circleForce();

        //$scope.showAxis();
        $log.debug("[WorldcupController] draw completed");
    })
    
    /**
     * EXPOSE Layout
     */
    $scope.flagGrid = Layout.flagGrid;
    $scope.circleForce = Layout.circleForce;
    $scope.circleXY = Layout.circleXY;
    
    
    /**
     * AXIS: create the axis using the team group on the X axis and FIFA relative ranking
     * as Y axis.
     *   - Axis are identified using id of `xaxis` and `yaxis` and has a css class of `axis`
     *   - Transform is needed to give it some space between the axis and the canvas.  For y
     *     axis, as the flags are drawn using #flag-group div, it is already down-shifted so
     *     y is set to zero.
     */
    function initializeAxis() {
        var xAxis = d3.svg.axis()
            .scale(Layout.scaleGroup())
            .orient("bottom")
            .tickValues(Layout.team_groups())
            .tickSize(-Layout.height())
        ;
        
        var yAxis = d3.svg.axis()
            .scale(Layout.scaleRankRel())
            .orient("left")
            .ticks(5)
            .tickSize(-Layout.width())
        ;
        
        var tx = Layout.margin('left'),
            ty = 0;
        axis_group
            .attr("transform", "translate(" + tx + "," + ty + ")");
        
        axis_group.append("g")
            .attr("id", "xaxis")  
            .attr("class", "axis")
            .attr("transform", "translate(0," + Layout.height() + ")")
            .call(xAxis);
        
        axis_group.append("g")
            .attr("id", "yaxis")
            .attr("class", "axis")
            .call(yAxis);
        ;
    }
    
    /**
     * Initialize Flag: create flag divs as 0,0 position using following structure
     *   <div class="team" title="Colombia" id="team-col">
     *       <span class="flagsp flagsp_col"></span>
     *       <span class="team-code">COL</span>
     *   </div>
     */
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
    function initializeFlag(data) {
        var team_flag = flag_group
            .selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", "team")
            .attr("title", function (d) { return d.team_name; })
            .attr("id", function (d) { return d.team_idclass; })
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
                return d.fifa_code.toUpperCase();
            })
        ;
    }
    
    /**
     * Initialize circle setting the FIFA rank as area of the circle, with help
     * from rankScale.
     */
    function circleMouseOver (d, i) {
        // Move the flag closer to the circle, only if the layout is circleForce
        $log.log("circleMouseOver: ", Layout.current_layout());
        if (Layout.current_layout() === "circleForce") {
            var id_name = d.team_idclass,
                circle = d3.select(this),
                x = circle.attr("cx"),
                y = parseFloat(circle.attr("cy")) + Layout.margin("top") - 10;

            d3.select("#" + id_name)
                .transition()
                .duration(500)
                .attr("style", "top: " + y + "px; left: " + x + "px;");
        }
    }
    function circleMouseOut (d, i) {
        // Return the flag to original position
        if (Layout.current_layout() === "circleForce") {
            var id_name = d.team_idclass;
            d3.select("#" + id_name)
                .transition()
                .duration(500)
                .attr("style", d.orig_position)
            ;
        }
    }
    function initializeCircle(data) {
        var circles = circle_group.selectAll("circle"),
            rankScale = Layout.scaleRank(),
            color = Layout.color();

        circles
            .data(data)
            .enter()
            .append("circle")
            .attr("id", function (d) { return d.circle_idclass; })
            .attr("class", "team")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", function (d) {
                // Return r as to produce a circle with area of FIFA Rank
                return Math.sqrt(rankScale(d.fifa_rank)/Math.PI)
            })
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
    
    }

    
}]);