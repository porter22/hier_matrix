requirejs(["utils"], function(utils) {
  var margin = {top: 80, right: 0, bottom: 10, left: 200},
  width = 420,
  height = 420;

  /*var x = d3.scale.ordinal().rangeBands([0, width]),
  z = d3.scale.linear().domain([0, 4]).clamp(true),
  c = d3.scale.category10().domain(d3.range(10));*/
  
  var x =  d3.scaleBand()
  .rangeRound([0, width]),
  z = d3.scaleLinear()
  .domain([0, 4])
  .clamp(true),
  c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));
  
  var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("id", "#svg1")
  .attr("height", height + margin.top + margin.bottom)
  .style("margin-left", -margin.left + "px")
  .style("margin-top", "50px")
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  var svg_two = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  //.style("margin-left", -margin.left + "px")
  .append("g");
  //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
  var path_div = d3.select("body").append("div")
  .attr("id", "#path_div");
  
  //TREEMAP, adapted from https://bl.ocks.org/denjn5/bb835c4fb8923ee65a13008832d2efed

  var variants = {
    "name": "variants",
        "children": [
          {
            "name": "variant blue car"
          },
          {
            "name": "variant red car"
          },
          {
            "name": "variant pink car"
          }
        ]
  }
  
  //vData = d3.stratify()(vCsvData)
  var root_data = {
    "name": "all",
    "children": [
      {
        "name": "variants",
        "children": [
          {
            "name": "variant blue car"
          },
          {
            "name": "variant red car"
          },
          {
            "name": "variant pink car"
          }
        ]
      },
      {
        "name": "system functions",
        "children": [
          {
            "name": "color general"
          },
          {
            "name": "color blue"
          },
          {
            "name": "color red"
          },
          {
            "name": "color pink"
          }
        ]
      },
      {
        "name": "requirements",
        "children": [
          {
            "name": "bumper black",
            "description": "The bumper of the car shall be black"
          },
          {
            "name": "door blue"
          },
          {
            "name": "hood blue"
          },
          {
            "name": "door red"
          },
          {
            "name": "hood red"
          },
          {
            "name": "door pink"
          },
          {
            "name": "hood pink"
          }
        ]
      },
      {
        "name": "architecture",
        "children": [
          {
            "name": "bumper"
          },
          {
            "name": "door"
          },
          {
            "name": "hood"
          }
        ]
      }
    ]
  }

  //var vSlices = svg_three.selectAll('rect').data(vNodes).enter().append('rect');
  
  // Draw on screen
  /*vSlices.attr('x', function (d) { return d.x0; })
  .attr('y', function (d) { return d.y0; })
  .attr('width', function (d) { return d.x1 - d.x0; })
  .attr('stroke', 'white')
  .attr('fill', '#05668D')
  .attr('height', function (d) { return d.y1 - d.y0; });*/
  
  //select cell, append rect, color it properly
  
  d3.json("./files/hierarchical_v4.json", function(miserables) {
    
    var matrix = [],
    nodes = miserables.nodes

    //DRAWING TREES
    var tree_width = 300
    var tree_height = 300
    var domains_list = ["variants","system functions", "requirements","architecture"]
    var domains_count = domains_list.length;
    for (let step = 0; step < domains_count; step++) {
      var svg_gen = d3.select("body").append("svg")
                                  .datum(miserables.nodes[step])
                                  .attr("width", tree_width )
                                  .attr("height", tree_height )
                                  .attr("class", domains_list[step])
                                  .attr("svg_order", step)
                                  .style("transform", "rotate(90deg)")
                                  //.style("margin-left", -margin.left + "px")
                                  .append("g");  
      draw_tree(miserables.nodes[step], tree_height, tree_width, svg_gen);
    }
    
    //get the flat list of nodes
    var nodelist = getNodeListfromTree(nodes, [], 0);
    
    var n = nodelist.length;
    
    // initialize nodes
    nodelist.forEach(function(node, i) {
      node.index = i;
      node.descendants = 0;
      matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0 }; });
      node.collapsed = false;
      //initialize parents
      if (node.children) {
        node.children.forEach(function(child, j) {
          child.parentID = i;
        });
      }
    });
    
    //setting descendantsfor each top level element
    var top_nodes = get_top_nodes(nodelist);
    //var top_nodes = [nodelist[0],nodelist[9]] //TODO: write a proper function to determine the top nodes
    
    top_nodes.forEach(set_descendants);
    
    console.log("nodelist:", nodelist)
    console.log("matrix:", matrix);
    
    console.log("miserables nodes:", miserables.nodes);
    console.log("miserables links:", miserables.links);
    
    //add to miserables.links for first level nodes
    var added_links = get_top_links(miserables.links, nodelist);

    var total_links = miserables.links.concat(added_links);

    console.log(total_links);
    
    //var indexedLinks = getIndexedLinks(miserables.links, nodelist);
    var indexedLinks = getIndexedLinks(total_links, nodelist);
    
    // Convert links to matrix; count character occurrences.
    //miserables.links.forEach(function(link) {
    total_links.forEach(function(link) {
      //console.log("checking link ", link);
      //matrix[link.source][link.target].z += link.value;
      //console.log("source index: ", getNodeIndexByName(nodelist, link.source));
      //console.log("target index: ", getNodeIndexByName(nodelist, link.target));
      matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.target)].z = 1;
      matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.source)].z = 1;
      matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.source)].z = 1;
      matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.target)].z = 1;
    });
    
    //matrix[0][0].z = 22;
    console.log("matrix after:", matrix);
    
    //get only Z to create adjacency matrix for bfs
    //NOTE: ignores top level nodes
    var adj_matrix = get_adj_matrix_no_tops(matrix, top_nodes);
    
    //var shortestPath = bfs(adj_matrix, 1, 10); // [1, 2, 3, 5]
    //console.log("shortestPath:", shortestPath)
    
    var vLayout = d3.treemap().size([20, 20]).paddingOuter(0);
    
    var vRoot = d3.hierarchy(root).count();
    var vNodes = vRoot.descendants();
    console.log("vNodes:", vNodes);
    vLayout(vRoot);
    
    // Precompute the orders.
    var orders = {
      name: d3.range(n).sort(function(a, b) { return d3.ascending(nodelist[a].index, nodelist[b].index); }),
      //count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
      //group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
    };
    
    // The default sort order.
    x.domain(orders.name);
    
    svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);
    
    var row = svg.selectAll(".row")
    .data(matrix)
    .enter().append("g")
    .attr("class", "row")
    .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
    .attr("nodeid", function(d, i) { return i })
    .attr("name", function(d, i) { return nodelist[i].name; })
    .each(row);
    
    row.append("line")
    .attr("x2", width)
    .attr("stroke", "white");
    
    row.append("text")
    .attr("x", function(d, i) {
      var shift = nodelist[i].level * 10
      return shift - 110} )
      .attr("y", x.bandwidth() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "start")
      .text(function(d, i) { return nodelist[i].name; })
      .on("mousedown", textmousedown)
      .on("dblclick",handleDoubleClick);
      
      var column = svg.selectAll(".column")
      .data(matrix)
      .enter().append("g")
      .attr("class", "column")
      .attr("nodeid", function(d, i) { return i })
      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
      
      column.append("line")
      .attr("x1", -width)
      .attr("stroke", "white");
      
      column.append("text")
      .attr("x", 6)
      .attr("y", x.bandwidth() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "start")
      .text(function(d, i) { return nodelist[i].name; })
      .on("mousedown",handleDoubleClickColumn);;
      //.on("mouseover", textmouseover);
      
      function row(row) {
        var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) { return x(d.x); })
        .attr("width", x.bandwidth())
        .attr("height", x.bandwidth())
        .attr("label", function(d) { return "templabel"; } )
        .attr("link_type", function(d) {
          var link_type = getLinkColorType(d.x,d.y, indexedLinks);
          return link_type[1]
        })
        .style("fill-opacity", function(d) { return z(d.z); })
        //.style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
        .style("fill", function(d) {
          var link_color = getLinkColorType(d.x,d.y, indexedLinks);
          return link_color[0];
        })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
        
        //now that we have a proper root tree and ability to fit treemaps into cells, lets find a way to asssign positions treemaps based on cells
        //if row is a first level, then do the treemap
        
      }
      
      //TREEMAP CODE
      /*var firsts_list = [4,9,17] //first level nodes
      var firsts = svg.selectAll(".row").filter(function(d, i) {
        //console.log(i);
        if (firsts_list.includes(i) || i==0)
        return i
      });
      
      //treemap cell
      firsts.selectAll(".mini").data(vNodes).enter().append('rect')
      .attr('x', function (d) { return d.x0 + 100; })
      .attr('y', function (d) { return d.y0; })
      .attr('class', 'mini')
      .attr('label', function (d) { return d.data.name })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style('stroke', 'white')
      .style('fill', function (d) { return Math.floor(Math.random()*16777215).toString(16)});*/
      
      
      console.log("nodes for force:", nodelist)
      console.log("indexedLinks for force:", indexedLinks)
      
      var force = d3.forceSimulation()
      .nodes(nodelist)
      .force('link', d3.forceLink(indexedLinks).distance(10))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('collide', d3.forceCollide().radius(2).strength(5))
      .force('x', d3.forceX(200).strength(0.1))
      .force('y', d3.forceY(200).strength(0.1));
      //.force('charge', d3.forceManyBody().strength(-10))
      //.force('collide', d3.forceCollide().radius(2).strength(5));
      
      //force.linkDistance(width/3.5);
      
      var nlink = svg_two.selectAll(".link")
      .data(indexedLinks)
      .enter().append("line")
      .attr("class", "link")
      .attr("stroke", "black")
      .attr('source', function(d,i) {
        //console.log("nlink:", d)
      });
      
      var nnode = svg_two.selectAll(".node")
      .data(nodelist)
      .enter().append("circle")
      .attr("class", "node")
      .attr("fill", "#ccc")
      .attr("stroke", "#000")
      .attr("r", 4.5);
      
      var ntexts = svg_two.selectAll("text.label")
      .data(nodelist)
      .enter().append("text")
      .attr("class", "label")
      .attr("fill", "black")
      .text(function(d) {  return d.name;  });
      
      /*function tick() {
        nlink.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
        
        nnode.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
        
        ntexts.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      }*/
      
      force.on('tick', function(){
        svg_two.selectAll('.node')
        .attr('transform', function(d){
          return 'translate(' + d.x + ',' + d.y + ')' })
          svg_two.selectAll('.link')
          .attr('x1', function(d){ return d.source.x })
          .attr('x2', function(d){ return d.target.x })
          .attr('y1', function(d){ return d.source.y })
          .attr('y2', function(d){ return d.target.y })
          ntexts.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
          });
        })
        
        var selected_couple = []; //arrey of max 2 items
        
        function handleDoubleClickColumn(d, i) {
          
        }
        
        function handleDoubleClick(d, i) {
          console.log("clicked object index:", i);
          console.log("which is node", nodelist[i]);
          clicked_selection = getRowSelection(i);
          clicked_selection.attr("clicked",true);
          //clicked_selection.attr("lastDescendant", 0);
          //hideInParent(i);
          //var ddata = d3.select(d.srcElement).data()[0];
          
          //if not collapsed
          //collapse
          //if has children
          //count descendants
          //move descendats up or down
          console.log("clicked object index:", i);
          if (!nodelist[i].collapsed) {
            collapse(nodelist[i]);
            //clicked_selection.attr("lastDescendant", 0);
            //console.log("out of collapse for node, ", nodelist[i]);
            if (nodelist[i].children){
              desc_count = nodelist[i].descendants;
              startindex = i + desc_count;
              console.log("i:", i)
              console.log("desc_count:", desc_count)
              console.log("startindex:", startindex)
              moveRestRows(nodelist, startindex, desc_count, "up");
            }
          }
          else {
            decollapse(nodelist[i]);
            if (nodelist[i].children){
              //count descendants
              desc_count = nodelist[i].descendants;
              startindex = i + desc_count;
              moveRestRows(nodelist, startindex, desc_count, "down");
            }
          }
        }
        
        function textmousedown(p, selectedindex) {
          //handles first and second selection of items
          if (selected_couple.length != 1) {
            if (selected_couple.length == 2) {
              selected_couple = [];
              d3.selectAll(".row text").classed("second_select", false);
              d3.selectAll(".column text").classed("second_select", false);
            }
            d3.selectAll(".row text").classed("first_select", function(d, i) { return i == selectedindex; });
            d3.selectAll(".column text").classed("first_select", function(d, i) { return i == selectedindex; });
            selected_couple.push(selectedindex);
          } else if (selected_couple.length == 1) {
            d3.selectAll(".row text").classed("second_select", function(d, i) { return i == selectedindex; });
            d3.selectAll(".column text").classed("second_select", function(d, i) { return i == selectedindex; });
            selected_couple.push(selectedindex);
            
            //find shortest path
            var shortestPath = bfs(adj_matrix, selected_couple[0], selected_couple[1]);
            var shortestPath_string = ''
            var separator = ' --> '
            shortestPath.forEach(function(element){
              shortestPath_string = shortestPath_string + separator +  nodelist[element].name;
            })
            var out_string = "shortestPath between:" + nodelist[selected_couple[0]].name 
            + " and " + nodelist[selected_couple[1]].name + " is: " 
            + shortestPath_string.substring(separator.length)
            //console.log("shortestPath between :", selected_couple[0]," and ",selected_couple[1]," is: ", shortestPath)
            
            //remove previous string
            path_div.selectAll('p').remove()
            
            //output to html
            path_div.append('p')
            .text(out_string)
            .attr('font-weight','800');
            
            //highigligh in both tree and graph viz
            highlight_path(nodelist, shortestPath);
            
            if (!shortestPath)
            console.log("PATH NOT FOUND")
          }
          //console.log("selected couple:", nodelist[selected_couple[0]], nodelist[selected_couple[1]]);
        }
        
        function mouseover(p) {
          d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
          d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
          //show relationship type
          showLegend(p);
        }
        
        function mouseout() {
          d3.selectAll("text").classed("active", false);
          d3.selectAll('.tooltip').style("opacity", 0);
        }
        
        d3.select("#order").on("change", function() {
          clearTimeout(timeout);
          order(this.value);
        });
        
        function order(value) {
          x.domain(orders[value]);
          
          var t = svg.transition().duration(2500);
          
          t.selectAll(".row")
          .delay(function(d, i) { return x(i) * 4; })
          .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
          .selectAll(".cell")
          .delay(function(d) { return x(d.x) * 4; })
          .attr("x", function(d) { return x(d.x); });
          
          t.selectAll(".column")
          .delay(function(d, i) { return x(i) * 4; })
          .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
        }
        
        // Define the div for the tooltip
        var div = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);
        
        
        /*var timeout = setTimeout(function() {
          order("group");
          d3.select("#order").property("selectedIndex", 2).node().focus();
        }, 5000);*/
      })
      //var bfs = require('bfs').bfs;
      /*var adj_matrix = [[1, 1, 0, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 0],
      [0, 0, 1, 0, 1, 1],
      [1, 1, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0]];*/
      
    }); //require
    