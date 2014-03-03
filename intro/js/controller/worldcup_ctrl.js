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
        initializeTeam(data);
        initializeCircle(data);
        
        // Default Layout
        Layout.flagGrid();
        $scope.circleForce();

        //$scope.showAxis();
        $log.debug("[WorldcupController] draw completed");
    })
    
    /**
     * EXPOSE Layout
     */
    $scope.flagGrid = Layout.flagGrid;
    $scope.circleForce = function () {
        $scope.disable_axisLayout = true;
        Layout.circleForce().then(function () {
            $scope.disable_axisLayout = false;
        });
    };
    $scope.circleXY = Layout.circleXY;
    
    
    /**
     * DRAWING
     */
    var priv_showAxis = false;
    $scope.showAxis = function () {
        var axis = d3.selectAll(".axis");
        priv_showAxis = !priv_showAxis;
        axis.classed("show", priv_showAxis);
    }
    
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
            ty = Layout.margin('top') - Layout.margin('bottom');
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
    
    function initializeTeam(data) {
        var team_flag = flag_group
            .selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", "team")
            .attr("title", function (d) { return d.team_name; })
            .attr("id", function (d) { return d.team_idclass; })
            //.on("mouseover", teamMouseOver)
            //.on("mouseout", teamMouseOut)
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
                // Ranking should be the area of the circle
                return Math.sqrt(rankScale(d.fifa_rank)/Math.PI)
                //return rankScale(d.fifa_rank)
            })
            .attr("fill", function (d) {
                return color(d.team_group);
            })
            //.on("mouseover", circleMouseOver)
            //.on("mouseout", circleMouseOut)
            .append("title")
            .text(function (d) {
                return d.team_name;
            })
        ;
    
    }
    
    
    
    
    
}]);