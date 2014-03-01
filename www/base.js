(function() {

    var width = 1200;
    var height = 540;
    var minYear = 2006;
    var maxYear = 2013;

    var coefTotalExpHKD = 1 / (Math.PI * 100);
    var coefHKD = 1 / (Math.PI * 25);

    var marginX = width / (maxYear - minYear + 2) / 2;
    var marginBalls = 8;

    var roundedFormat = d3.format("0.2f");

    var init = true;
    var initDuration = 2000, normalDuration = 2000;

    var svg = d3.select("#g").append("svg")
	.attr("width", width)
	.attr("height", height);

    queue()
        .defer(d3.csv, "budget.expenditures.csv")
        .defer(d3.csv, "budget.heads.csv")
        .await(ready);

    function ready(error, exp, heads) {

        /* Getters */
        function getExpObjFromName (name) {
            for (var i=0; i<exp.length; i++) {
                if (exp[i].name == name) return exp[i];
            }
            return null;
        }
        function getExpObjFromHead (head) {
            for (var i=0; i<exp.length; i++) {
                if (exp[i].head == head) return exp[i];
            }
            return null;
        }
        function getHeadNameFromHeadId (headid) {
            for (var i=0; i<heads.length; i++) {
                if (heads[i].id == headid.substr(1,3)) return heads[i].name;
            }
            return null;
        }

        /* Functional functions */
        function getMostRelevant (d) {
            if (d.actual !== undefined) return d.actual;
            else if (d.revised !== undefined) return d.revised;
            else return d.estimate;
        }
        function radiusFromValue (val) {
            return Math.sqrt(val / Math.PI);
        }
        function formatHKD (hkd) {
            // start with values in thousands
            if (hkd < 1000) {
                suffix = ",000";
                divider = 1;
            }
            else if (hkd < 1000000) {
                suffix = " million";
                divider = 1000;
            }
            else if (hkd < 1000000000) {
                suffix = " billion";
                divider = 1000000;
            }
            else if (hkd < 1000000000000) {
                suffix = " trillion";
                divider = 1000000000;
            }
            return "$" + roundedFormat(hkd / divider) + suffix;
        }

        /* Define scales */
        var xfunc = d3.scale.linear()
            .domain([minYear-2, maxYear])
            .range([marginX, 1280-marginX]);

        /* Reformat the data */
        var totals = null;
        exp.forEach(function(d) {
            for (x in d) {
                if (x != "name") {
                    d[x] = Number(d[x]);
                }
            }
            if (totals == null) {
                totals = {};
                for (x in d) {
                    if (x != "name" && x != "head") totals[x] = 0;
                }
            }
            if (d["head"] != 184) {
                for (x in d) {
                    if (x != "name" && x != "head") totals[x] += d[x];
                }
            }
        });
        /* Reformat by actual applicable fiscal year */
        var expyear = [];
        for (var y=minYear-2; y<=maxYear; y++) {
            if (y+2 == minYear) expyear.push({"year":y, "actual":{}});
            else if (y+1 == minYear) expyear.push({"year":y, "actual":{}, "approved":{}, "revised":{}});
            else if (y+1 == maxYear) expyear.push({"year":y, "approved":{}, "revised":{}, "estimate":{}});
            else if (y == maxYear) expyear.push({"year":y, "estimate":{}});
            else expyear.push({"year":y, "actual":{}, "approved":{}, "revised":{}, "estimate":{}});
        }
        for (var i=0; i<exp.length; i++) { // each head
            for (var y=minYear; y<=maxYear; y++) { // each year
                if (exp[i]["head"] == 184) continue;
                index = y-minYear+2;
                expyear[index-2]["actual"][String(exp[i]["head"])] = exp[i]["actual"+y];
                expyear[index-1]["approved"][String(exp[i]["head"])] = exp[i]["approved"+y]; 
                expyear[index-1]["revised"][String(exp[i]["head"])] = exp[i]["revised"+y];
                expyear[index]["estimate"][String(exp[i]["head"])] = exp[i]["estimate"+y];
            }
        }
        for (var y=minYear; y<=maxYear; y++) { // each year
            index = y-minYear+2;
            expyear[index-2]["actual"]["year"] = y;
            expyear[index-1]["approved"]["year"] = y;
            expyear[index-1]["revised"]["year"] = y;
            expyear[index]["estimate"]["year"] = y;
            expyear[index-2]["actual"]["type"] = "actual";
            expyear[index-1]["approved"]["type"] = "approved"; 
            expyear[index-1]["revised"]["type"] = "revised";
            expyear[index]["estimate"]["type"] = "estimate";
            expyear[index-2]["actual"]["total_expenditures"] = totals["actual"+y];
            expyear[index-1]["approved"]["total_expenditures"] = totals["approved"+y]; 
            expyear[index-1]["revised"]["total_expenditures"] = totals["revised"+y];
            expyear[index]["estimate"]["total_expenditures"] = totals["estimate"+y];
        }

        /* Show totals per year */
        var gYearsContainer = svg.append("g")
            .attr("class", "year-container");
        var gYears = gYearsContainer.selectAll("g")
            .data(expyear)
        .append("g")
            .attr("transform", function(d,i) {return "translate("+xfunc(d.year)+",100)";});
        gYears.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", function(d, i) {
                return Math.sqrt(getMostRelevant(d)["total_expenditures"]) * coefTotalExpHKD;
            })
            .attr("class", function(d, i) {
                return getMostRelevant(d)["type"];
            });
        gYears.append("text")
            .attr("x", 0)
            .attr("y", 100)
            .text(function(d){return d.year;});
        gYearsContainer.transition()
            .duration(0)
            .delay(0)
            .style("opacity", 0);

        /* Show per expense head */
        headData = d3.map(expyear[maxYear-minYear+2]["estimate"]);
        headData.remove("year");
        headData.remove("type");
        headData.remove("total_expenditures");

        /* Add some force */
        var nodes = d3.entries(headData).sort(function(a,b) { return b.value - a.value;})
        var force = d3.layout.force()
            .gravity(0.8)
            .friction(0.3)
            .charge(function(d, i) { return -Math.pow(Math.sqrt(d.value) * coefHKD, 2.0) * 3; })
            .nodes(nodes)
            .size([width, height]);
        force.start();

        var gHeadsContainer = svg.append("g")
            .attr("class", "head-container");
        cumulWidth = 0;
        cumulRow = 0;
        rowHeight = 0;
        rowWidth = 0;
        var gHeads = gHeadsContainer.selectAll("g")
            .data(nodes)
        .enter().append("g")
            .attr("transform", function (d,i) {
                return "translate("+(width/2)+",10)";
            })
            /*.attr("transform", function(d,i) {
                if (rowHeight == 0) {
                    rowHeight = Math.sqrt(d.value) * coefHKD + marginBalls * 4;
                    rowWidth = Math.sqrt(d.value) * coefHKD + marginBalls * 2;
                }
                var w = cumulWidth + rowWidth;
                var h = cumulRow + Math.sqrt(d.value) * coefHKD;// + rowHeight;
                cumulWidth += Math.sqrt(d.value) * coefHKD * 2 + marginBalls;
                if ((cumulWidth + Math.sqrt(d.value) * coefHKD + marginBalls) > width) {
                    cumulRow += rowHeight * 1.9;
                    rowHeight = Math.sqrt(d.value) * coefHKD + marginBalls * 4;
                    rowWidth = Math.sqrt(d.value) * coefHKD + marginBalls * 2;
                    cumulWidth = 0;
                    w = cumulWidth + rowWidth;
                    h = cumulRow + Math.sqrt(d.value) * coefHKD;// + rowHeight;
                    cumulWidth += Math.sqrt(d.value) * coefHKD * 2 + marginBalls;
                }
                //return "translate("+(w)+","+(h)+")";
                //return 'translate('+width/2+', '+height/2+')';
                return "";
            })*/;
        var tblocks = gHeads.append("text")
            .attr("x", 0)
            .attr("y", function(d, i) {
                return marginBalls * 2;
                //return Math.sqrt(d.value) * coefHKD + marginBalls * 3;
            })
            .attr("class", "heads-under-text")
            .attr("id", function(d, i) {
                return "heads-under-text-" + d.key.substr(1,4);
            });
        tblocks
            .append("tspan")
            .attr("x", 0)
            .text(function(d) {
                return getHeadNameFromHeadId(String(d["key"]));
            });
        tblocks
            .append("tspan")
            .attr("class", "currency-text")
            .attr("x", 0)
            .attr("dy", marginBalls * 2)
            .text(function(d) {
                return formatHKD (d.value);
            });
        var gHeadsCircles = svg.selectAll("circle")
            .data(nodes)
        .enter().append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 0)
            .attr("class", "head-circle")
            .attr("id", function(d, i) {
                return "head-circle-" + d.key.substr(1,4);
            });
        gHeadsCircles
            .transition(4000)
            .delay(500)
            .attr("r", function(d, i) {
                return Math.sqrt(d.value) * coefHKD;
            });
        gHeadsCircles
            .on("click", headClick)
            .on("mouseover", headMouseOver)
            .on("mouseout", headMouseOut);
        function headClick (d, i) {
            var headid = d.key.substr(1,4);
            if (headid.length < 3) headid = "0" + headid;
            window.open("http://www.budget.gov.hk/2013/eng/pdf/head" + headid + ".pdf");
        }
        function headMouseOver (d, i) {
            d3.select("#heads-under-text-" + d.key.substr(1,4)).style("display", "block");
            d3.select("#heads-under-text-" + d.key.substr(1,4)).style("opacity", 1)
            d3.select("#head-circle-" + d.key.substr(1,4)).style("stroke-width", 4);
        }
        function headMouseOut (d, i) {
            d3.selectAll(".heads-under-text").style("display", "none");
            d3.selectAll(".heads-under-text").style("opacity", 0);
            d3.selectAll(".head-circle").style("stroke-width", 1);
        }

        function valueSort (alpha) {
            /*if (rowHeight == 0) {
                rowHeight = Math.sqrt(d.value) * coefHKD + marginBalls * 4;
                rowWidth = Math.sqrt(d.value) * coefHKD + marginBalls * 2;
            }
            var w = cumulWidth + rowWidth;
            var h = cumulRow + Math.sqrt(d.value) * coefHKD;// + rowHeight;
            cumulWidth += Math.sqrt(d.value) * coefHKD * 2 + marginBalls;
            if ((cumulWidth + Math.sqrt(d.value) * coefHKD + marginBalls) > width) {
                cumulRow += rowHeight * 1.9;
                rowHeight = Math.sqrt(d.value) * coefHKD + marginBalls * 4;
                rowWidth = Math.sqrt(d.value) * coefHKD + marginBalls * 2;
                cumulWidth = 0;
                w = cumulWidth + rowWidth;
                h = cumulRow + Math.sqrt(d.value) * coefHKD;// + rowHeight;
                cumulWidth += Math.sqrt(d.value) * coefHKD * 2 + marginBalls;
            }*/
            //return "translate("+(w)+","+(h)+")";
            //return 'translate('+width/2+', '+height/2+')';
            return function(d) {
                d.x += ((d.index % 12) * 90 - 500) * (alpha);
                var maxRows = 7;
                var coef = 1;
                var incr = 0;
                var rowNb = Math.floor(d.index / 12);
                if (rowNb > 2) {
                    coef = 0.5;
                    incr = 60;
                } else if (rowNb > 1) {
                    coef = 0.8;
                    incr = 0;
                }
                d.y += (rowNb * 100 * coef + incr - 160) * (alpha);
            };
        };

        function randomize () {
            return function (d) {
                var targetX = width / 2;
                var targetY = height / 2;
                d.x += (targetX - d.x) * 0.1;
                d.y += (targetY - d.y) * 0.1;
            }
        }

        function totalLayout () {
            force
                .gravity(10)
                .friction(0.6)
                .on("tick", function(e) {
                    svg.selectAll("circle")
                    .each(randomize())
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y + 20; });
                })
                .start();
            for (var i=0; i<100; i++) force.tick();
            force.stop();
            force
                .gravity(0.6)
                .friction(0.2)
            .on("tick", function(e){
                svg.selectAll("circle")
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y + 20; });
            }).start();
        }
        function orderedLayout () {
            force
                .gravity(1)
                .friction(0);
            force.on("tick", function(e){
                svg.selectAll("circle")
                .each(valueSort(e.alpha))
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y + 20; });
            }).start();
        }
        totalLayout();
        //orderedLayout();
        //setTimeout(orderedLayout, 2000);
        d3.select("#sorting")
            .on("click", function (e) {
                if (d3.select("#sorting").attr("class").indexOf("selected")>=0) {
                    d3.select("#sorting").attr("class", d3.select("#sorting").attr("class").replace(/selected/,""));
                    totalLayout();
                } else {
                    d3.select("#sorting").attr("class", d3.select("#sorting").attr("class") + " selected");
                    orderedLayout();
                }
            });

        d3.select("#loadingbar").style("display", "none");
    }
})();
