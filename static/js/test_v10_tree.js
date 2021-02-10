requirejs(["utils"], function(utils) {
  
  //  CONVENTIONS
  // - links of top levels are aggregated from bottom levels
  // - if parent nodes are moved, their children move with them, too 
  // - if element moves to another domain, then what?
  
  //Add references:
  //Matrix: https://bost.ocks.org/mike/miserables/
  //Curved bezier:
  
  var margin = {top: 0, right: 0, bottom: 10, left: 100},
  width = 900,
  height = 1200,
  cell_height = 10;
  let text_shift = 200;
  
  /*var x = d3.scale.ordinal().rangeBands([0, width]),
  z = d3.scale.linear().domain([0, 4]).clamp(true),
  c = d3.scale.category10().domain(d3.range(10));*/
  
  /*THIS PART CHANGES WITH DATA*/ 
  //GRUNDFOS
  var rel_dict = {
    "none":"gray",
    "=same":"black",
    ">allocated_to":"#845EC2",
    "<allocated_to":"#D65DB1",
    ">verified_by":"#FF6F91",
    "<verified_by":"#FF9671",
    ">satisfies":"#FFC75F",
    "<satisfies":"#F9F871" };

  //var domains = ['STAKEHOLDER REQUIREMENTS', 'SYSTEM REQUIREMENTS', 'LEVEL1_ARCHITECTURE', 'LEVEL2_ARCHITECTURE', 'TESTS']
  var domains = ['STAKEHOLDER REQUIREMENTS', 'SYSTEM REQUIREMENTS', 'LEVEL1_ARCHITECTURE', 'TESTS']
//VIESSMANN
    /*var rel_dict = {
      "none":"gray",
      "=same":"black",
      ">allocates":"#845EC2",
      "<allocates":"#D65DB1",
      ">has_parent":"#FF6F91",
      "<has_parent":"#FF9671",
      ">is_contained_by":"#FFC75F",
      "<is_contained_by":"#F9F871" };*/
  
  //var domains = ['variants', 'system functions', 'requirements', 'architecture']
    
    var x =  d3.scaleBand()
    .rangeRound([0, width])
    
    var y =  d3.scaleBand()
    .rangeRound([0, height])
    
    z = d3.scaleLinear()
    .domain([0, 4])
    .clamp(true),
    c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));

    var matrix_margin = margin.left + text_shift/2
    
    var svg = d3.select(".content").select('#matrix_div').append("svg")
    //.attr("width", width + margin.left + margin.right)
    .attr("width", width)
    //.attr("height", height + margin.top + margin.bottom)
    .attr("height", height)
    .attr("id", "#svg1")
    .attr("viewBox", '0 0 1000 1300')
    .style("margin-left", margin.left + "px")
    .style("margin-top", - text_shift / 2)
    .append("g")
    .attr("transform", "translate(" + matrix_margin +  "," + text_shift / 2 + ")")
    
    /*var matrix_div = d3.select('#matrix_div')
    .on("mouseout", svg_mouseout);*/
    
    var path_div = d3.select(".content").append("div")
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
    
    //check the json loaded from flask
    console.log(json_data.links);
    
    var matrix = [],
    nodes = json_data.nodes
    
    //get the flat list of nodes
    var nodelist = getNodeListfromTree(nodes, [], 0);
    
    var n = nodelist.length;
    
    // initialize nodes
    nodelist.forEach(function(node, i) {
      node.index = i;
      node.descendants = 0;
      node.order = i
      node.descendants_list = []
      matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0, t: -1}; });
      node.collapsed = false;

      //initialize parents
      if (node.children) {
        node.children.forEach(function(child, j) {
          child.parentID = i;
        });
      }
    });

    //create node dictionary to easier transition from name to description
    //node[name] = description
    nodedict = {}
    for (i = 0; i < nodelist.length - 1; i++) {
      var node = nodelist[i]
      if (node.description) {
        nodedict[node.name] = node.name + ' ' + node.description
      } else {
        nodedict[node.name] = node.name
      }
    }

    console.log('nodedict:', nodedict);

    //original order of rows
    var original_order = []
    nodelist.forEach(function(node, i) {
      original_order.push(i)
    })

    console.log('original order', original_order)
    
    //setting descendantsfor each top level element
    var top_nodes = get_top_nodes(nodelist);
    //var top_nodes = [nodelist[0],nodelist[9]] //TODO: write a proper function to determine the top nodes
    
    top_nodes.forEach(set_descendants);
    
    console.log("nodelist:", nodelist)
    console.log("matrix:", matrix);
    
    console.log("json_data nodes:", json_data.nodes);
    console.log("json_data links:", json_data.links);
    
    //ANCHOR LINK AGGREGATION FOR TOP LEVELS
    //add to json_data.links for first level nodes
    var added_links = add_ancestor_links(json_data.links, nodelist);
    //console.log("added ancestor links", added_links);
    
    var total_links = json_data.links.concat(added_links);
    
    //console.log("total links", total_links);
    
    //var indexedLinks = getIndexedLinks(json_data.links, nodelist);
    //var indexedLinks = getIndexedLinks(total_links, nodelist);
    
    //ANCHOR CONVERTING LINKS INTO MATRIX
    
    total_links.forEach(function(link) {
      
      var inversed = inverse_rel(link.value)
      
      //setting relationship types
      matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.target)].z = Object.keys(rel_dict).indexOf(link.value);
      matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.source)].z = Object.keys(rel_dict).indexOf(inversed);
      matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.source)].z = 1;
      matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.target)].z = 1;
      
      //setting test results
      var link_result_num = -1
      if (link.results === 'Failed') {
        //console.log("link result set to zero")
        link_result_num = 0
        matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.target)].t = link_result_num;
        matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.source)].t = link_result_num;
        
      } else if (link.results === 'Passed') {
        //console.log("link result set to one")
        link_result_num = 1
        matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.target)].t = link_result_num;
        matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.source)].t = link_result_num;
        
        /*test_dict = {}
        test_dict['link.target'] = link.results
        var src_node_index = getNodeIndexByName(nodelist, link.source)
        nodelist[src_node_index]['test_results'] = test_dict
        console.log('nodelist[src_node_index]', nodelist[src_node_index])
        */
      }

      //TODO: add test result info to nodedict
      //node.test_results['req_node_name'] = link.results


      //setting aggregation indicators
      var aggr_fill_opacity = 0
      if (link.is_aggregated == true) {
        //console.log('link is aggregated:', link)
        aggr_fill_opacity = 0.3
      } else {
        //console.log('link is NOT aggregated:', link)
        aggr_fill_opacity = 1
      }
      matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.target)].aggr = aggr_fill_opacity;
      matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.source)].aggr = aggr_fill_opacity;

    });
    
    //console.log("matrix after:", matrix);
    
    //get only Z to create adjacency matrix for bfs
    //TODO: ignores top level nodes
    var adj_matrix = get_adj_matrix_no_tops(matrix, top_nodes);
    
    //var shortestPath = bfs(adj_matrix, 1, 10); // [1, 2, 3, 5]
    //console.log("shortestPath:", shortestPath)
    
    /*var vLayout = d3.treemap().size([20, 20]).paddingOuter(0);
    
    var vRoot = d3.hierarchy(root).count();
    var vNodes = vRoot.descendants();
    console.log("vNodes:", vNodes);
    vLayout(vRoot);*/
    
    // Precompute the orders.
    var orders = {
      index: d3.range(n).sort(function(a, b) { return d3.ascending(nodelist[a].index, nodelist[b].index); }),
      //count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
      //group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
    };
    console.log("orders:", orders)
    
    // The default sort order.
    x.domain(orders.index);

    svg.append('pattern')
    .attr('id', 'diagonalHatchRed')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 4)
    .append('path')
    .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
    //.style('fill','yellow')
    .attr('stroke', 'red')
    .attr('stroke-width', 0.7);

    svg.append('pattern')
    .attr('id', 'diagonalHatchGreen')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 4)
    .append('path')
    .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
    //.style('fill','yellow')
    .attr('stroke', 'green')
    .attr('stroke-width', 1);


    
    svg.append("rect")
    .attr("class", "background")
    //.attr("width", width)
    .attr("width", nodelist.length * cell_height)
    .attr("height", nodelist.length * cell_height)
    //.on("mouseout", svg_mouseout)
    //.attr("height", height);

    //ANCHOR ROW CREATION
    
    var row = svg.selectAll(".row")
    .data(matrix)
    .enter().append("g")
    .attr("class", "row")
    .attr("transform", function(d, i) { 
      //console.log("position changes to ", cell_height*i)
      //return "translate(0," + x(i) + ")"; 
      return "translate(0," + cell_height*i + ")"; 
    })
    .attr("nodeid", function(d, i) { return i })
    .attr("name", function(d, i) { return nodelist[i].name; })
    .attr("type", function(d, i) { return nodelist[i].type; })
    .attr('highlight','')
    .attr('highlight_count', 0)
    .each(row);
    
    row.append("line")
    .attr("x2", width)
    .attr("stroke", "white");
    
    row.append("text")
    .attr("x", function(d, i) {
      var shift = nodelist[i].level * 10
      return shift - text_shift} )
      //.attr("y", x.bandwidth() / 2)
      .attr("y", cell_height / 2)
      .attr("dy", ".32em")
      .attr("text-align", "left")
      .text(function(d, i) { 
        var result = nodelist[i].name
        // if description non empty, add first 50 chars of description
        if (nodelist[i].description) {
          return nodelist[i].name + ' ::: ' + nodelist[i].description.substring(0, 20)
        } else {
          return nodelist[i].name;
        }
      })
      .on("mousedown", textmousedown)
      .on("mouseover", textmouseover)
      .on("mouseout", textmouseout)
      .on("dblclick", handleDoubleClick)
      
      //on shift+down, move row below
      Mousetrap.bind('shift+down', function() {
        //move_selected_rows(nodelist, 'down', 20)  
        switch_selected_rows(original_order, 'down', matrix, nodelist)
      });
      
      //on shift+up, move row above
      Mousetrap.bind('shift+up', function () {
        switch_selected_rows(original_order, 'up', matrix, nodelist)  
      });
      
      
      //ANCHOR COLUMNS AND ROWS MAIN
      
      var column = svg.selectAll(".column")
      .data(matrix)
      .enter().append("g")
      .attr("class", "column")
      .attr("nodeid", function(d, i) { return i })
      //.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; }); //GF
      .attr("transform", function(d, i) { return "translate(" + i * cell_height + ")rotate(-90)"; });
      
      column.append("line")
      .attr("x1", -width)
      .attr("stroke", "white");
      
      column.append("text")
      .attr("x", 6)
      //.attr("y", x.bandwidth() / 2)
      .attr("y", cell_height / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "start")
      //.text(function(d, i) { return nodelist[i].name; })
      .text(function(d, i) { 
        var result = nodelist[i].name
        // if description non empty, add first 50 chars of description
        if (nodelist[i].description) {
          return nodelist[i].name + ' ::: ' + nodelist[i].description.substring(0, 20)
        } else {
          return nodelist[i].name;
        }
           })
      .on("mousedown",handleDoubleClickColumn);;
      //.on("mouseover", textmouseover);

      //ANCHOR CELL CREATION
      
      function row(row) {
        var cell = d3.select(this).selectAll(".cell")
        //.data(row.filter(function(d) { return d.z; })) this filters out values that have connections
        .data(row) //we take all the cells
        .enter().append("rect")
        .attr("class", "cell")
        //.attr("x", function(d) { return x(d.x); })
        .attr("x", function(d) { return d.x * cell_height })
        //.attr("width", x.bandwidth()) GF
        .attr("width", cell_height)
        //.attr("height", x.bandwidth()) GF
        .attr("height", cell_height)
        .attr("label", function(d) { return "templabel"; } )
        .attr("link_type", function(d) {
          //var link_type = getLinkColorType(d.x,d.y, indexedLinks);
          //return link_type[1]
          let link_type = Object.keys(rel_dict)[d.z]
          //console.log('dz', d.z)
          return link_type
        })
        .attr('source',function(d) {return nodelist[d.y].name})
        .attr('target',function(d) {return nodelist[d.x].name})
        
        .attr('is_aggregated',function(d) {
          if (d.aggr == 1) {
            return "aggregated"
          } else {
            return "not_aggregated"
          }
        })
        .attr('test_results', function(d) { return d.t })
        //.style("fill-opacity", function(d) { return z(d.z); })
        .style("fill-opacity", function(d) { 
          //take d.aggr
          //if aggr, return 1
          //else return 0.3
          return d.aggr; })
        //.style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
        .style("fill", function(d) {
          //var link_color = getLinkColorType(d.x,d.y, indexedLinks);
          //return link_color[0];
          if (d3.select(this).attr('test_results') === "1") {
            return 'url(#diagonalHatchGreen)'
          } else if (d3.select(this).attr('test_results') === "0") {
            return 'url(#diagonalHatchRed)'
          }

          let link_type = Object.keys(rel_dict)[d.z]
          return rel_dict[link_type]
        })
        //.style("fill",'url(#diagonalHatch)')
        .on("mouseover", cell_mouseover)
        .on("mouseout", cell_mouseout);
        //.on("mousedown", cell_mousedown);
      }

      d3.selectAll('.cell').append('image')
      .attr('xlink:href', 'http://www.clker.com/cliparts/P/Z/w/n/R/W/red-smiley-face-hi.png')
      .attr("width", 10)
      .attr("height", 10)
      .attr("y", 0)
      .attr("x", 0)
      .attr("preserveAspectRatio", "none");

      

      // Define the div for the tooltip
      var tooltip = d3.select(".content").append("div")
      //.style("top", d3.select(this).attr("y") + "px");
      .attr("class", "tooltip")				
      .style("opacity", 0);

      console.log("nodes for force:", nodelist)
      //console.log("indexedLinks for force:", indexedLinks)
      
      function handleDoubleClickColumn() {
        
      }
      
      var selected_couple = []; //arrey of max 2 items
      function handleDoubleClick(d, i) {
        //console.log("clicked object index:", i);
        //console.log("which is node", nodelist[i]);
        clicked_selection = getRowSelection(i);
        clicked_selection.attr("clicked",true);
        
        //console.log("clicked object index:", i);
        if (!nodelist[i].collapsed) {
          
          collapse(nodelist[i]);

          //console.log('nodelist in handle double click:', nodelist)
          
          var hidden_row_indexes = find_rows_visible_or_hidden('hidden')
                
          change_cols_visibility(hidden_row_indexes, 'hidden')
          
          change_cells_visibility (hidden_row_indexes, nodelist, 'hidden');
          
          remove_empty_rows(original_order, cell_height, matrix, nodelist)

          //shrink background
          resize_background (hidden_row_indexes, cell_height)

        }
        else {
          if (nodelist[i].children){
            
            decollapse(nodelist[i]);

            //move back rows
            update_rows_translate(updated_order.sort(compare_numbers));
            
            console.log('updated order:', updated_order.sort(compare_numbers))
            
            var hidden_row_indexes = find_rows_visible_or_hidden('visible')
            
            //make columns visible again
            change_cols_visibility(hidden_row_indexes, 'visible')
            
            //make cells visible again
            change_cells_visibility(hidden_row_indexes, nodelist, 'visible')
            
            //move columns back
            update_cols_translate(updated_order.sort(compare_numbers));
            
            //move cells back
            update_cells_translate(updated_order.sort(compare_numbers), nodelist, cell_height);

            //expand background
            resize_background (updated_order.sort(compare_numbers), cell_height)
          }
        }
      }
      
      
      //on mousedown, highlight the whole row and connected columns
      /*function textmousedown(p, selectedindex) {
        
        highlight_row(selectedindex);
        
      }*/
      
      
      //ANCHOR HANDLE TEXT MOUSE OVER
      function textmouseover(p, selectedindex) {
       
        highlight_row(selectedindex);
        
        highlight_columns(selectedindex);
        
      }

      function get_connected_nodes(input_index) {
        result = []

        matrix[input_index].forEach(function(node, index) {
          if (node.z > 0)
          result.push(index)
        })

        return result 
      }
      
      //highlights column texts, if there is a connection with the selected row
      function highlight_columns(selectedindex) {
        
        //reset previous highlighting
        d3.selectAll('.column').selectAll('text').style('fill', 'black')
        
        cols_to_highlight = []
        //find row in matrix
        console.log('selectedindex:', selectedindex)
        console.log('matrix row:', matrix[selectedindex])
        //get a list of cells connected (rel_value != 0)
         
        matrix[selectedindex].forEach(function(node, index) {
          if (node.z > 0)
          cols_to_highlight.push(index)
        })
          
          
          console.log('cols to highlight:', cols_to_highlight)
          
          //select all column texts that match the cols_to_highlight
          var selected_cols = d3.selectAll(".column").filter(function(d,i) {
           var cur_col_id = parseInt(d3.select(this).attr('nodeid'))
           
           if (cols_to_highlight.includes(cur_col_id))
           return true
          })
          
          selected_cols.selectAll('text').style('fill','red');
        }

        function textmouseout (p, selectedindex) {
          //unhighlight all columns
          d3.selectAll('.column').select('text').style('fill', 'black')
          
          //unhighlight black line
          d3.selectAll('line').style('stroke', 'white')
        }
        
        //ANCHOR HANDLE TEXT CLICK
        //look at matrix, find all the visible cells, print all the target nodes, by type (Requirements) 
        function textmousedown(p, selectedindex) {
          
          //clear summary div
          d3.selectAll('#summary_div').selectAll('p').remove();
          
          //find the row with the selected index and print it to the top of the summary
          var sel_row = d3.selectAll(".row").filter(function(d) { 
            if (d3.select(this).attr('nodeid') == selectedindex) {
              output_summary("Source:" + d3.select(this).attr('name'), div_class = 'main_nodes')
              return true
            }
          })

          output_summary("Connected nodes:", div_class = 'main_nodes')

          //find all visible cells, where color is not gray or black
          var visible_cells = sel_row.selectAll('.cell').filter(function(d) { 
            return (d3.select(this).attr('visibility') != 'hidden' && d3.select(this).style('fill') != 'gray' && d3.select(this).style('fill') != 'black')
          })

          //go through visible cells, print all core nodes
          visible_cells.each(function(d) {
            var node_name = d3.select(this).attr('target')
            console.log(d3.select(this).attr('target'));

            //get node description from node name
            var node_desc = nodedict[node_name]

            //ouput target node to summary div
            output_summary(node_desc, div_class = 'connected_nodes')

            //find target node index
            node_index = getNodeIndexByName(nodelist, node_name)
            console.log('target node name:', nodedict[nodelist[node_index].name])
            
            //get indeces of nodes connected to target node
            nodes_to_print = get_connected_nodes(node_index)
            
            //we skip first level nodes, such as SYSTEM REQUIREMENTS OR TESTS
            if (nodelist[node_index].level > 0){
              for (nodeid of nodes_to_print) {
                //we need only connections through SYSTEM REQUIREMENTS
                if (nodelist[nodeid].type == 'STAKEHOLDER REQUIREMENTS') {
                  console.log('connected node:', nodedict[nodelist[nodeid].name])
                  output_summary(nodedict[nodelist[nodeid].name], 'sub_connected_nodes')
                }
              }
            }

            //check if any tests are bound to these System Requirements
            if (nodelist[node_index].type == 'SYSTEM REQUIREMENTS' && nodelist[node_index].test){
              output_summary('CONNECTED TESTS', 'sub_connected_nodes')
              output_summary(nodelist[node_index].test, 'sub_connected_nodes')
              if (nodelist[node_index].test_results == 'Passed')
                output_summary(nodelist[node_index].test_results, 'sub_connected_nodes passed')
              else if (nodelist[node_index].test_results == 'Failed')
                output_summary(nodelist[node_index].test_results, 'sub_connected_nodes failed')
            }

          })
        }

      //the old mousedown selected two elements to create a path between them
      function textmousedown_path(p, selectedindex) {
        //handles first and second selection of items
        if (selected_couple.length != 1) {
          if (selected_couple.length == 2) {
            selected_couple = [];
            d3.selectAll(".row text").classed("second_select", false);
            d3.selectAll(".column text").classed("second_select", false);
            d3.selectAll(".row").classed("selected", false);
          }
          d3.selectAll(".row text").classed("first_select", function(d, i) { return i == selectedindex; });
          d3.selectAll(".column text").classed("first_select", function(d, i) { return i == selectedindex; });
          d3.selectAll(".row").classed("selected", function(d, i) { return i == selectedindex; });
          selected_couple.push(selectedindex);
        } else if (selected_couple.length == 1) {
          d3.selectAll(".row text").classed("second_select", function(d, i) { return i == selectedindex; });
          d3.selectAll(".column text").classed("second_select", function(d, i) { return i == selectedindex; });
          selected_couple.push(selectedindex);
          
          //OUTPUT PATH
          var shortestPath = bfs(adj_matrix, selected_couple[0], selected_couple[1]);
          var shortestPath_string = ''
          var separator = ' --> '
          shortestPath.forEach(function(element){
            shortestPath_string = shortestPath_string + separator +  nodelist[element].name;
          })
          var out_string = "shortestPath between:" + nodelist[selected_couple[0]].name 
          + " and " + nodelist[selected_couple[1]].name + " is: " 
          + shortestPath_string.substring(separator.length)
          console.log("shortestPath between :", selected_couple[0]," and ",selected_couple[1]," is: ", shortestPath)
          
          //remove previous string
          path_div.selectAll('p').remove()
          
          //output to html
          path_div.append('p')
          .text(out_string)
          .attr('font-weight','800');
          
          //ANCHOR ARCS in MATRIX code
          
          var arc_links = []
          for (i = 0; i < shortestPath.length - 1; i++) {
            link_obj = {}
            link_obj.source = nodelist[shortestPath[i]]
            link_obj.target = nodelist[shortestPath[i + 1]]
            arc_links.push(link_obj); 
          }
          
          var link = svg.append('g')
          .attr('class', 'arc_links')
          .selectAll('path')
          .data(arc_links)
          .enter().append('path')
          .attr('d', function (d) {
            //xsrc = x(d.source.index) + 10
            xsrc = d.source.index * cell_height + cell_height/2
            //xtrg = x(d.target.index) + 10
            xtrg = d.target.index * cell_height + cell_height/2
            //use cubic bezier curve
            result = "M" + xsrc + "," + xsrc + 
            "C" + xtrg + "," + xsrc +
            " " + xtrg + "," + xsrc + 
            " " + xtrg + "," + xtrg
            console.log("path is:", result) 
            return result;
          })
          .attr("fill", 'none')
          .attr("stroke", 'blue')
          
          //HIGHLIGHT PATH
          highlight_path(nodelist, shortestPath);
          
          if (!shortestPath)
            console.log("PATH NOT FOUND")
        }
        //console.log("selected couple:", nodelist[selected_couple[0]], nodelist[selected_couple[1]]);
      }

      //ANCHOR TOOLTIP CODE
      
      function cell_mouseover(p) {
        //console.log("selected p:",p)
        d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
        d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
        //show relationship type
        showLegend(p);
      }
      
      function cell_mouseout() {
        d3.selectAll("text").classed("active", false);
        d3.select('.tooltip').transition()
                             .duration(200)		
                             .style("opacity", 0);
                            
        //d3.selectAll(this).classed('active',false);
        //d3.selectAll(this).attr('pointer-events','none');

        //div .text(result)
            
      }
      
      //ANCHOR SETTING RELS IN CELLS
      //on matrix cell click, popup possible relationship types, update user's choice to edgelist, redraw cell
      function cell_mousedown(p) {
        console.log(d3.select(this).attr('class'))
        const this_class = d3.select(this).attr('class')
        const this_rel_type = d3.select(this).attr('link_type')
        const clicked_cell = this
        
        //if pressed already, remove menu rect, set class as not pressed
        if (this_class.includes("pressed")) {
          console.log('element is already pressed', this)
          
          d3.selectAll('.popup').remove()
          d3.select(this).attr('class','cell free') //as opposite to pressed
        } else {
          console.log('this element is not pressed', this)
          d3.select(this).attr('class','cell pressed')
          //get svg coordinates of the clicked cell
          //get x,y from p, multiply by height(20)
          
          //draw X rectangles next to the clicked cell
          //var rel_list = ['one','two','three','four','five','six','seven'] 
          var rel_list = Object.keys(rel_dict) //possible relationship objects (name = '< has_allocation', color = 'yellow', opacity depends on direction)
          
          //deactivate pointer events in all cells, except for the ones that will be created
          d3.selectAll('.cell').attr('pointer-events','none')
          d3.selectAll('.text').attr('pointer-events','none')
          
          //d3.select(this).attr('opacity',0.9)
          //select the current row element
          var row_element = d3.select(this.parentNode).selectAll('.row')
          
          d3.select(this.parentNode).raise()
          //d3.selectAll('.row').lower()
          
          //row_element.attr('opacity',1)
          
          var menu = row_element.append('g').attr('class', 'menu-entry')
          
          menu.data(rel_list) //we take all the cells
          .enter()
          .append("rect")
          .attr("class", "cell popup")
          .raise()
          .attr("x", p.x * 20 + 20)
          .attr("y", function(d, i) {
            return (i-Math.round(rel_list.length/2))*20 //rewrite so that the current color is centered
          })
          .attr("width", x.bandwidth()*5)
          .attr("height", x.bandwidth())
          .attr("label", function(d) { 
            return d; } )
            //.style("fill-opacity", 0.5)
            .attr('pointer-events','auto') //enables them to be selected on mouseover
            .style('stroke-width', 0.4)
            .style('stroke', 'black')
            .style("fill", function(d) {       
              return rel_dict[d]; } )
              .on("mousedown", edit_cell_mousedown)
              .on('mouseover', function(d) {       
                console.log(rel_dict[d])
              });
              
              menu.data(rel_list) //we take all the cells
              .enter().append('text')
              .attr('class','popup')
              .attr("x", p.x * 20 + 20 + 3)
              .attr("y", function(d, i) {
                return (i-Math.round(rel_list.length/2))*20 + 20/2 //rewrite so that the current color is centered
              })
              .attr("dy", ".35em")
              .text(function(d) { return d; })
              .on("mousedown", edit_cell_mousedown);
              
              
              function edit_cell_mousedown(new_rel_type){
                console.log('new cell rel type',new_rel_type)
                
                var this_rel_type = d3.select(this).text()

                console.log('selected cell rel type', this_rel_type)
                console.log('this',clicked_cell)
                
                //get source and target indices
                const source =d3.select(clicked_cell).attr('source')
                const target =d3.select(clicked_cell).attr('target')
                
                console.log('source:',source)
                console.log('target:',target)

                //if selected is different from current value, update matrix and link_type attribute of that element
                if (new_rel_type !== this_rel_type) {
                  console.log('relationship has to change')
                  matrix[source][target].z = Object.keys(rel_dict).indexOf(new_rel_type)
                  matrix[target][source].z = Object.keys(rel_dict).indexOf(inverse_rel(new_rel_type))
                  
                  //update its link type attribute
                  d3.select(clicked_cell).attr('link_type',new_rel_type)
                  
                  //color the cell with the new color
                  console.log('set new color as:', rel_dict[new_rel_type])
                  d3.select(clicked_cell).style('fill',rel_dict[new_rel_type])
                  //find inverse cell and color it too
                  
                  //lower back that row
                  d3.selectAll('line').raise()
                  
                } 
                
                //save nodelist and matrix, using python - on firing some other Save button?
                
                
                
                //bring back pointer events on mouseover
                d3.selectAll('.cell').attr('pointer-events','auto')
                d3.selectAll('.text').attr('pointer-events','auto')
                
                //hide popup menu
                d3.selectAll('.popup').remove()
                
                //d3.selectAll('.column').raise()
              }
            } //end else
            
          } //end cell_mousedown
          
          d3.select("#order").on("change", function() {
            clearTimeout(timeout);
            order(this.value);
          });
          
          function order(value) {
            x.domain(orders[value]);
            
            var t = svg.transition().duration(2500);
            
            t.selectAll(".row")
            .delay(function(d, i) { return x(i) * 4; })
            .attr("transform", function(d, i) { 
              console.log("this thing kicks in")
              return "translate(0," + x(i) + ")"; })
              .selectAll(".cell")
              .delay(function(d) { return x(d.x) * 4; })
              .attr("x", function(d) { return x(d.x); });
              
              t.selectAll(".column")
              .delay(function(d, i) { return x(i) * 4; })
              .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
            }
            
            //ANCHOR FILTERS

            //adapted from https://www.d3-graph-gallery.com/graph/bubblemap_buttonControl.html
            //var entity_type_dropdown = d3.select("#entity_type_dropdown")
            
            //DRAW ENTITY FILTERS
            //FILTER BY RELATIONSHIP TYPES
            var rel_types = Object.keys(rel_dict)
            var rel_checkbox = d3.select("#rel_type_checkbox").append('div')

            rel_types.forEach(function(rel_type, index) {
              
              var inner_div = rel_checkbox.append('div').attr('class','checkbox_div')
              
              /*inner_div.append('input')
              .attr('id', 'rel' + index.toString())
              .attr('type', 'checkbox')
              .attr('class', 'rel checkbox')
              .attr('checked', 'true')
              .attr('value', rel_type)
              inner_div.append('label')
              .attr('class', 'container')
              .attr('for', 'rel' + index.toString())
              .text(rel_type)*/

              var div_label = inner_div.append('label')
                                       .attr('class', 'container')
                                       .text(rel_type)
              
              div_label.append('input')
                       .attr('id', 'rel' + index.toString())
                       .attr('type', 'checkbox')
                       .attr('class', 'rel checkbox')
                       .attr('checked', 'true')
                       .attr('value', rel_type);
                       
              
              div_label.append('span')
                       .attr('class', 'checkmark')
                       .style('background-color', rel_dict[rel_type]);
              
            })
            
            //FILTER BY ENTITY TYPES
            var ent_checkbox = d3.select("#entity_type_dropdown").append('div').attr('class','dropdown_wrapper')
            domains.forEach(function(domain, index) {

              var inner_div = ent_checkbox.append('div').attr('class','checkbox_div')

              inner_div.append('input')
                                .attr('id', index)
                                 .attr('type', 'checkbox')
                                 .attr('class', 'ent checkbox')
                                 .attr('checked', 'true')
                                 .attr('value', domain)
              inner_div.append('label')
                                .attr('for', index)
                                .text(domain)
            })

            //FILTER OUT EMPTY ROWS
            var empty_rows_checkbox = d3.select('#norel_checkbox').append('div').attr('class','dropdown_wrapper')

            empty_rows_checkbox.append('input')
                               .attr('id', 'emptyrows')
                               .attr('type', 'checkbox')
                               .attr('class', 'empty checkbox')
                               .attr('checked', 'true')
                               .attr('value', 'emptyrows')
            empty_rows_checkbox.append('label')
                                .attr('for', 'emptyrows')
                                .text('Show empty rows')

            //FILTER OUT AGGREGATED ROWS
            var aggr_rows_checkbox = d3.select('#aggr_checkbox').append('div').attr('class','dropdown_wrapper')

            aggr_rows_checkbox.append('input')
                               .attr('id', 'aggr_rows')
                               .attr('type', 'checkbox')
                               .attr('class', 'aggr checkbox')
                               .attr('checked', true)
                               .attr('value', 'aggr_rows')
            aggr_rows_checkbox.append('label')
                                .attr('for', 'aggr_rows')
                                .text('Show/Hide aggregated rows')

            //HIGHLIGHT NON-CONNECTED ROWS

            //create wrapper div
            var highlight_checkbox_div = d3.select('#highlight_checkbox').append('div').attr('class','dropdown_wrapper')

            create_uncovered_filter_div(highlight_checkbox_div, 'sys_stake', 'System Reqs NOT covered by Stakeholder Reqs')
            create_uncovered_filter_div(highlight_checkbox_div, 'stake_sys', 'Stakeholder Reqs NOT covered by System Reqs')
            create_uncovered_filter_div(highlight_checkbox_div, 'sys_arch', 'System Reqs NOT covered by Architecture')
            create_uncovered_filter_div(highlight_checkbox_div, 'arch_sys', 'Architecture NOT covered by System Reqs')
            create_uncovered_filter_div(highlight_checkbox_div, 'sys_test', 'System Reqs NOT covered by Tests')
            create_uncovered_filter_div(highlight_checkbox_div, 'test_sys', 'Tests NOT covered by System Reqs')

            // When button change, update function
            d3.selectAll(".checkbox").on("change", function (d,i) {
              var clicked_box = d3.select(this)
              var box_value = clicked_box.property("value")

              var filter_type = '';

              if (box_value in rel_dict) {
                filter_type = 'relationships'
              } else if (box_value === 'emptyrows') {
                filter_type = 'empty'
              } else if (box_value === 'aggr_rows') {
                filter_type = 'aggr'
              } else if (box_value === 'sys_stake_rows') {
                filter_type = 'sys_stake_high'
              } else if (box_value === 'stake_sys_rows') {
                filter_type = 'stake_sys_high'
              } else if (box_value === 'sys_arch_rows') {
                filter_type = 'sys_arch_high'
              } else if (box_value === 'arch_sys_rows') {
                filter_type = 'arch_sys_high'
              } else if (box_value === 'sys_test_rows') {
                filter_type = 'sys_test_high'
              } else if (box_value === 'test_sys_rows') {
                filter_type = 'test_sys_high'
              } else {
                filter_type = 'entities'
              }

              console.log('clicked checkbox value', box_value)

              if(clicked_box.property("checked")){ 
                //If not highlighting filters, change visibility
                if (filter_type.indexOf('high') === -1) { 
                
                  console.log('selected box shown:', box_value, filter_type)

                  change_rows_visibility(box_value, 'visible', filter_type)
                  var visible_row_indexes = find_rows_visible_or_hidden('visible')

                  console.log('visible row indexes: ', visible_row_indexes)
                  
                  //update the order of rows
                  //merge current order with the visible row indexes, remove duplicates, sort
                  updated_order = Array.from(new Set(updated_order.concat(visible_row_indexes))).sort(compare_numbers)

                  console.log('updated row after merging with visible row indexes: ', updated_order)

                  //move back rows
                  update_rows_translate(updated_order);

                  change_cols_visibility(visible_row_indexes, 'visible')

                  //show hidden cells
                  change_cells_visibility (visible_row_indexes, nodelist, 'visible');

                  //move columns back
                  update_cols_translate(updated_order);
              
                  //move cells back
                  update_cells_translate(updated_order, nodelist, cell_height);

                  //shrink background
                  resize_background (updated_order, cell_height)

                } else { //if highlighting filter, do not hide, just highlight

                  highlight_unconnected_rows(filter_type, to_highlight = true) //highlight rows that match the filter_type

                }
              } else { // Otherwise hide it

                if (filter_type.indexOf('high') === -1) { 
                  console.log('selected box hidden:', box_value, filter_type)
                  
                  change_rows_visibility(box_value, 'hidden', filter_type)
                  
                  //hide columns
                  var hidden_row_indexes = find_rows_visible_or_hidden('hidden')
                  
                  change_cols_visibility(hidden_row_indexes, 'hidden')
                  
                  //remove cells
                  change_cells_visibility (hidden_row_indexes, nodelist, 'hidden');

                  //rows as well
                  remove_empty_rows(original_order, cell_height, matrix, nodelist)
                  
                  //shrink background
                  resize_background (hidden_row_indexes, cell_height)
                  
                } else {
                  highlight_unconnected_rows(filter_type, to_highlight = false) //highlight rows that match the filter_type
                }
              }

            });

            

            

            /*d3.select("#emptyrows").on("change", function (d,i) {
              console.log('change detected')
              var clicked_box = d3.select(this)

              if(clicked_box.property("checked")){

                change_rows_visibility(box_value, 'visible', is_rel_type)
                
                //svg.selectAll("."+grp).transition().duration(1000).style("opacity", 1).attr("r", function(d){ return size(d.size) })
                
                // Otherwise I hide it
              }else{
                console.log('selected box hidden:', box_value, is_rel_type)
                change_rows_visibility(box_value, 'hidden', is_rel_type)
              }
            })*/


            //ANCHOR EXPORT FUNCTIONALITY
            d3.selectAll('.export_button').on('mousedown', function (d,i) {
              console.log('to export:', matrix, nodelist)
              export_matrix(matrix, nodelist)
            })

            //entity_type_dropdown.selectAll("input.myCheckbox").on("change",checkbox_action);


            /*var timeout = setTimeout(function() {
              order("group");
              d3.select("#order").property("selectedIndex", 2).node().focus();
            }, 5000);*/
            
            //var bfs = require('bfs').bfs;
            /*var adj_matrix = [[1, 1, 0, 0, 1, 0],
            [1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 0],
            [0, 0, 1, 0, 1, 1],
            [1, 1, 0, 1, 0, 0],
            [0, 0, 0, 1, 0, 0]];*/
            
          }); //require
          
          /*
          SNIPPETS:
          
          ---SORTING ROWS
          d3.selectAll('.person')
          .sort(function(a, b) {
            return b.score - a.score;
          });
          ---
          
          */
          