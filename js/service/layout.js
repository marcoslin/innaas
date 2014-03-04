(function () {
    var app = angular.module("d3jsapp");

    /*
     * Agregator Utility:  Tool to find max, min and distinct on a single loop
     * of the incoming data.
     */
    function Aggregator() {
        var priv_holder = { max: {}, min: {}, distinct: {} },
            priv_dist_holder = {};
        
        // MAX
        this.setMax = function (name, input) {
            var check_val = priv_holder["max"][name];
            if (typeof input === "undefined") {
                return;
            } else if (typeof check_val === "undefined") {
                priv_holder["max"][name] = input;
            } else if (input > check_val) {
                priv_holder["max"][name] = input;
            }
        };
        this.getMax = function (name) { return priv_holder["max"][name]; };
        
        // MIN
        this.setMin = function (name, input) {
            var check_val = priv_holder["min"][name];
            if (typeof input==="undefined") {
                return;
            } else if (typeof check_val==="undefined") {
                priv_holder["min"][name] = input;
            } else if (input < check_val) {
                priv_holder["min"][name] = input;
            }
        };
        this.getMin = function (name) { return priv_holder["min"][name]; };
        
        // DISTINCT
        this.setDistinct = function (name, input) {
            var holder = priv_dist_holder[name];
            if (typeof input==="undefined") {
                return;
            } else {
                // Variable initialization
                var dist_val = priv_holder["distinct"][name],
                    check_val = priv_dist_holder[name];
                if (typeof dist_val==="undefined") {
                    priv_holder["distinct"][name] = [];
                }
                if (typeof check_val==="undefined") {
                    priv_dist_holder[name] = {};
                }
                
                // Distinct Check
                if ( !priv_dist_holder[name].hasOwnProperty(input) ) {
                    priv_dist_holder[name][input] = true;
                    priv_holder["distinct"][name].push(input);
                }
            }
        };
        this.getDistinct = function (name) { return priv_holder["distinct"][name]; };
    
    }
    
    /*
     * SERVICE: Layout
     */
    app.service('Layout', ['$timeout', '$interval', '$q', '$log', function ($timeout, $interval, $q, $log) {
        var that = this,
            priv_data,
            priv_canvas, priv_margin, priv_width, priv_height,
            priv_team_groups,
            priv_scaleRank, priv_scaleRankRel, priv_scaleGroup,
            priv_color = d3.scale.category10(),
            priv_force,
            priv_current_layout;
        
        /**
         * Initialize layout manager with:
         *   data: input data to be used
         *   canvas: sizer of the drawable area
         *   margin: 4 margins around the canvas
         *
         *  Create scale needed using the input data
         */
        this.initialize = function (data, canvas, margin) {
            priv_data = data;
            priv_canvas = canvas;
            priv_margin = margin;
            priv_width = priv_canvas.width - (priv_margin.left + priv_margin.right);
            priv_height = priv_canvas.height - (priv_margin.top + priv_margin.bottom);
            
            // Find aggegate needed mostly by D3 scale
            var agg = new Aggregator();
            angular.forEach(data, function (entry) {
                agg.setMax("fifa_rank", entry.fifa_rank);
                agg.setMax("fifa_rank_rel", entry.fifa_rank_rel);
                agg.setMin("fifa_rank_rel", entry.fifa_rank_rel);
                agg.setDistinct("team_group", entry.team_group);
            });
            
            priv_team_groups = agg.getDistinct("team_group");
            
            // Normalize ranking data to a value from 0 to 50, with upper padding of 10
            priv_scaleRank = d3.scale.linear()
                .domain([agg.getMax("fifa_rank")+10, 0])
                .range([0, 5000])
            ;
            
            // Scale for fifa_rank_rel for Y-Axis
            priv_scaleRankRel = d3.scale.linear()
                .domain([agg.getMin("fifa_rank_rel"), agg.getMax("fifa_rank_rel")])
                .range([0, priv_height])
            ;
            
            // Ordinal group for X-Axis
            priv_scaleGroup = d3.scale.ordinal()
                .domain(priv_team_groups)
                .rangePoints([0, priv_width], 1)
            ;
            
            /*
            $log.debug("[Layout.initialize] max fifa_rank: ", agg.getMax("fifa_rank"));
            $log.debug("[Layout.initialize] min fifa_rank_rel: ", agg.getMin("fifa_rank_rel"));
            $log.debug("[Layout.initialize] max fifa_rank_rel: ", agg.getMax("fifa_rank_rel"));
            $log.debug("[Layout.initialize] distinct team_group: ", agg.getDistinct("team_group"));
            */
        };
        
        
        /*
         * PRIVATE METHOD: Show or hide Axis
         */
        function displayAxis(toShow) {
            var axis = d3.selectAll(".axis");
            axis.classed("show", toShow);
        }
        
        
        /**
         * LAYOUT Flag Grid: layout the flags using simple grid layout and add
         * a `orig_position` data attribute storing the initial location of the
         * flag allow flags to return to original position.
         */
        this.flagGrid = function () {
            var grid = d3.layout.grid()
                .bands()
                .nodeSize([4, 8])
                .rows(2)
                .cols(16)
                .padding([55, 17]);
            
            var orig_position,
                flag_divs = d3.select("#flag-group").selectAll("div");
            
            flag_divs
                .data(grid(priv_data))
                .transition()
                .attr("style", function (d) {
                    var pos = "top: " + d.y + "px; left: " + d.x + "px;"
                    d.orig_position = pos;
                    return pos;
                })
            ;
        };
        
        /**
         * LAYOUT Circle Force: Layout animiation built from 3 key pieces:
         *   - pullCircleToCenter(): Pull the circle toward the center of the canvas
         *   - expandCircle(): Call pullCircleToCenter() and then expand the circles
         *     by decreasing the gravity
         *   - circleForce(): Main method that will create the force and set the starting
         *     circle positions.
         */
        function expandCircle(circles, force) {
            // pullCircleToCenter is only used by expandCircle
            function pullCircleToCenter () {
                return function (d) {
                    var targetX = priv_width / 2;
                    var targetY = priv_height / 2;
                    d.x += (targetX - d.x) * 0.1;
                    d.y += (targetY - d.y) * 0.1;
                }
            }
            // Generate the effect that centralize bubbles in the center of the canvas
            force
                .gravity(2)
                .friction(0.4)
                .on("tick", function(e) {
                    circles
                    .each(pullCircleToCenter())
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
                        circles
                            .attr("cx", function(d) { return d.x; })
                            .attr("cy", function(d) { return d.y; });
                    })
                .start();
            }, 300);
        }
        
        this.circleForce = function () {
            // Returns a promise that will resolve when force animation finishes
            var d = $q.defer(),
                circles = d3.select("#circle-group").selectAll("circle");
            
            // Set the current layout
            priv_current_layout = "circleForce";
            
            // Only create force once
            if (typeof priv_force === "undefined") {
                priv_force = d3.layout.force()
                    .nodes(priv_data)
                    .gravity(0.8)
                    .friction(0.3)
                    .charge(function (d) {
                        // Negative multiple of radius
                        //$log.log("radius: " + d.r + ");
                        return Math.sqrt(priv_scaleRank(d.fifa_rank)/Math.PI) * -120;
                    })
                    .size([priv_canvas.width, priv_canvas.height])
                    .start()
                ;
            }
            
            displayAxis(false);
            that.flagGrid();
            
            /*
            A bizzard bug in the setting of cy below.  The logging of d shows the y property set
            but d.y return 0.  If tick is called in force, the py get updated but y continues to
            be zeo.  Leaving this as it only happens when priv_force is created.
            */
            circles
                .data(priv_data)
                .transition()
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
            ;
            
            expandCircle(circles, priv_force);
            
            var inter = $interval(function () {
                // $log.debug("[Layout] .circleForce waiting for force animation to complete with alpha of: ", priv_force.alpha());
                if (priv_force.alpha() === 0) {
                    $interval.cancel(inter);
                    inter = undefined;
                    d.resolve();
                }
            }, 700, 7);
            
            // As interval does not raiser error, need to check or the promise will be stuck forever
            $timeout(function () {
                if (inter) {
                    $log.error("[Layout.circleForce] $interval expired without detecting the end of animation");
                    $log.debug("[Layout.circleForce] forcing resolve");
                    // Force resolve anyways
                    d.resolve();
                } else {
                    $log.debug("[Layout.circleForce] $interval clear successfully");
                }
                
            }, 4900 + 200);
            
            return d.promise;
        };
        
        /**
         * LAYOUT Circle XY: 
         */
        this.circleXY = function () {
            var circles = d3.select("#circle-group").selectAll("circle"),
                x = priv_scaleGroup,
                y = priv_scaleRankRel;
            
            // Set the current layout
            priv_current_layout = "circleXY";
            
            // Stop force animation if still in progress
            if (priv_force.alpha() !== 0) {
                priv_force.stop();
            }

            displayAxis(true);
            
            circles
                .data(priv_data)
                .transition()
                .each("end", function (d) {
                    /*
                    `end` event fires when animation of the circle stops, and thus the
                    xy position is known.  Use this info to place the flag in the center
                    of the circle.  However, as position of the flag using done at top/left,
                    hard-coded padding is needed to nudge the flag toward the center.
                    */
                    var circle = d3.select(this),
                        flag = d3.select("#" + d.team_idclass),
                        padding_x = -22, padding_y = -10,
                        x = parseFloat(circle.attr("cx")) + padding_x,
                        y = parseFloat(circle.attr("cy")) + priv_margin.bottom + padding_y;
                    flag.attr("style", "top: " + y + "px; left: " + x + "px;");
                })
                .attr("cx", function(d) {
                    return x(d.team_group) + priv_margin.left;
                })
                .attr("cy", function(d) {
                    return y(d.fifa_rank_rel);
                })
            ;
        };
        
        /**
         * Canvas Related Properties
         */
        this.canvas_width = function () {
            return priv_canvas.width;
        };
        this.canvas_height = function () {
            return priv_canvas.height;
        };
        this.width = function () {
            return priv_width;
        };
        this.height = function () {
            return priv_height;
        };
        this.margin = function (side) {
            return priv_margin[side];
        };
        
        /**
         * D3 Scale related properties
         */
        this.scaleRank = function () {
            return priv_scaleRank;
        };
        this.scaleRankRel = function () {
            return priv_scaleRankRel;
        };
        this.scaleGroup = function () {
            return priv_scaleGroup;
        };
        
        /**
         * Return Formatter
         */
        this.color = function () {
            return priv_color;
        };
        
        /**
         * Other properties
         */
        this.current_layout = function () {
            return priv_current_layout;
        };
        
        this.team_groups = function () {
            return priv_team_groups;
        };
        
        
        
    }]);
})();

