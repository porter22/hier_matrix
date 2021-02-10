requirejs(["utils"], function(utils) {
  
  //  CONVENTIONS
  // - links of top levels are aggregated from bottom levels
  // - if parent nodes are moved, their children move with them, too 
  // - if element moves to another domain, then what?
  
  //Add references:
  //Matrix: https://bost.ocks.org/mike/miserables/
  //Curved bezier:
  
  var margin = {top: 80, right: 0, bottom: 10, left: 200},
  width = 420,
  height = 420;
  
  /*var x = d3.scale.ordinal().rangeBands([0, width]),
  z = d3.scale.linear().domain([0, 4]).clamp(true),
  c = d3.scale.category10().domain(d3.range(10));*/
  
  var rel_dict = {
    "none":"gray",
    "=same":"black",
    ">allocated_to":"#845EC2",
    "<allocated_to":"#D65DB1",
    ">verified_by":"#FF6F91",
    "<verified_by":"#FF9671",
    ">satisfies":"#FFC75F",
    "<satisfies":"#F9F871" };
    
    var x =  d3.scaleBand()
    .rangeRound([0, width])
    
    var y =  d3.scaleBand()
    .rangeRound([0, height])
    
    z = d3.scaleLinear()
    .domain([0, 4])
    .clamp(true),
    c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));
    
    var svg = d3.select(".content").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("id", "#svg1")
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
    .style("margin-top", "50px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    /*
    //CREATE SVG FOR NETWORK VIZ
    var svg_two = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    //.style("margin-left", -margin.left + "px")
    .append("g");
    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); */
    
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
    
    //console.log(root_data);
    
    //var vSlices = svg_three.selectAll('rect').data(vNodes).enter().append('rect');
    
    // Draw on screen
    /*vSlices.attr('x', function (d) { return d.x0; })
    .attr('y', function (d) { return d.y0; })
    .attr('width', function (d) { return d.x1 - d.x0; })
    .attr('stroke', 'white')
    .attr('fill', '#05668D')
    .attr('height', function (d) { return d.y1 - d.y0; });*/
    
    //select cell, append rect, color it properly
    
    //check the json loaded from flask
    console.log(json_data.links);
    
    var matrix = [],
    nodes = json_data.nodes

    console.log('nodes:', nodes)
    
    //DRAWING TREES
    /*
    var tree_width = 600
    var tree_height = 600
    //var domains_list = ["variants","system functions", "requirements","architecture"]
    var svg_gen = d3.select("body").append("svg")
    .datum(root_data)
    .attr("width", tree_width )
    .attr("height", tree_height )
    .attr("class", "tree")
    .style("transform", "rotate(90deg)")
    //.style("margin-left", -margin.left + "px")
    .append("g");  
    
    draw_tree(root_data, tree_height, tree_width, svg_gen);
    */
    
    //get the flat list of nodes
    var nodelist = getNodeListfromTree(nodes, [], 0);
    
    var n = nodelist.length;
    
    // initialize nodes
    nodelist.forEach(function(node, i) {
      node.index = i;
      node.descendants = 0;
      node.order = i
      node.descendants_list = []
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
    
    console.log("json_data nodes:", json_data.nodes);
    console.log("json_data links:", json_data.links);
    
    //add to json_data.links for first level nodes
    var added_links = get_top_links(json_data.links, nodelist);
    
    var total_links = json_data.links.concat(added_links);
    
    console.log(total_links);
    
    //var indexedLinks = getIndexedLinks(json_data.links, nodelist);
    //var indexedLinks = getIndexedLinks(total_links, nodelist);
    
    // Convert links to matrix; count character occurrences.
    //json_data.links.forEach(function(link) {
    
    //console.log(Object.keys(rel_dict).indexOf('>allocates'))
    total_links.forEach(function(link) {
      
      /*matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.target)].z = 1;
      matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.source)].z = 1;
      matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.source)].z = 1;
      matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.target)].z = 1;*/
      
      var inversed = inverse_rel(link.value)

      console.log('link:', link)
      console.log('rel number', Object.keys(rel_dict).indexOf(link.value))
      console.log('nodeindex src', getNodeIndexByName(nodelist, link.source))
      console.log('nodeindex trg', getNodeIndexByName(nodelist, link.target))
      
      matrix[getNodeIndexByName(nodelist, link.source)][getNodeIndexByName(nodelist, link.target)].z = Object.keys(rel_dict).indexOf(link.value);
      matrix[getNodeIndexByName(nodelist, link.target)][getNodeIndexByName(nodelist, link.source)].z = Object.keys(rel_dict).indexOf(inversed);
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
    
    svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);
    
    var row = svg.selectAll(".row")
    .data(matrix)
    .enter().append("g")
    .attr("class", "row")
    .attr("transform", function(d, i) { 
      console.log("position changes")
      return "translate(0," + x(i) + ")"; 
    })
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
      .on("dblclick",handleDoubleClick)
      
      //on shift+down, move row below
      Mousetrap.bind('shift+down', function() {
        move_selected_rows(nodelist, 'down', 20)  
      });
      
      //on shift+up, move row above
      Mousetrap.bind('shift+up', function () {
        move_selected_rows(nodelist, 'up', 20)  
      });
      
      //switch positions between two rows
      //change indexes in nodelist
      
      //if top level, move all children
      //allow only within domain
      
      //.attr("visibility", "hidden")   
      
      //DRAG AND DROP REORDERING
      
      
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
        //.data(row.filter(function(d) { return d.z; })) this filters out values that have connections
        .data(row) //we take all the cells
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) { return x(d.x); })
        .attr("width", x.bandwidth())
        .attr("height", x.bandwidth())
        .attr("label", function(d) { return "templabel"; } )
        .attr("link_type", function(d) {
          //var link_type = getLinkColorType(d.x,d.y, indexedLinks);
          //return link_type[1]
          let link_type = Object.keys(rel_dict)[d.z]
          //console.log('dz', d.z)
          return link_type
        })
        .attr('source',function(d) {return d.y})
        .attr('target',function(d) {return d.x})
        .style("fill-opacity", function(d) { return z(d.z); })
        //.style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
        .style("fill", function(d) {
          //var link_color = getLinkColorType(d.x,d.y, indexedLinks);
          //return link_color[0];
          let link_type = Object.keys(rel_dict)[d.z]
          return rel_dict[link_type]
        })
        .on("mouseover", cell_mouseover)
        .on("mouseout", cell_mouseout)
        .on("mousedown", cell_mousedown);
        
      }
      
      console.log("nodes for force:", nodelist)
      //console.log("indexedLinks for force:", indexedLinks)
      
      function handleDoubleClickColumn() {
        
      }
      
      var selected_couple = []; //arrey of max 2 items
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
          if (nodelist[i].children){
            //count descendants
            desc_count = nodelist[i].descendants;
            startindex = i + desc_count;
            moveRestRows(nodelist, startindex, desc_count, "down");
            decollapse(nodelist[i]);
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
          //console.log("shortestPath between :", selected_couple[0]," and ",selected_couple[1]," is: ", shortestPath)
          
          //remove previous string
          path_div.selectAll('p').remove()
          
          //output to html
          path_div.append('p')
          .text(out_string)
          .attr('font-weight','800');
          
          //ARCS in MATRIX code
          
          /* //create test link array
          var mtx_arcs = []
          var mtx_arc = {}
          mtx_arc.source = nodelist[1]
          //mtx_arc.source.x = 20
          //mtx_arc.source.y = 20
          mtx_arc.target = nodelist[5]
          //mtx_arc.target.x = 140
          //mtx_arc.target.y = 20
          mtx_arcs.push(mtx_arc) */
          
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
            console.log(x(1))
            console.log("links d:", x(d.source.index),x(d.source.index), x(d.target.index), x(d.target.index))
            xsrc = x(d.source.index) + 10
            xtrg = x(d.target.index) + 10
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
      
      function cell_mouseover(p) {
        d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
        d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
        //show relationship type
        showLegend(p);
      }
      
      function cell_mouseout() {
        d3.selectAll("text").classed("active", false);
        d3.selectAll('.tooltip').style("opacity", 0);
        //d3.selectAll(this).classed('active',false);
        //d3.selectAll(this).attr('pointer-events','none');
      }
      
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
                console.log('selected cell rel type',this_rel_type)
                console.log('this',clicked_cell)
                
                //get source and target indices
                const source =d3.select(clicked_cell).attr('source')
                const target =d3.select(clicked_cell).attr('target')
                
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
            
            // Define the div for the tooltip
            var div = d3.select(".content").append("div")	
            .attr("class", "tooltip")				
            .style("opacity", 0);
            
            //DROPDOWN THAT FILTERS MATRIX BY RELATIONSHIP TYPE
            //based on https://bl.ocks.org/ProQuestionAsker/8382f70af7f4a7355827c6dc4ee8817d
            var rel_type_dropdown = d3.select("#rel_type_dropdown")
            
            rel_type_dropdown
            .append("select")
            .selectAll("option")
            .data(Object.keys(rel_dict))
            .enter()
            .append("option")
            .attr("value", function(d){
              return d;
            })
            .text(function(d){
              return d;
            })
            
            // Run update function when dropdown selection changes
            rel_type_dropdown.on('change', function(){
              //unhide all rows
              d3.selectAll('.row').attr('visibility','hidden')
              //get selected valye
              var selected_rel_type = d3.select(this)
              .select("select")
              .property("value")
              console.log('something is chosen:', selected_rel_type)

              //select cells that have the selected relationships
              var rows_with_rel = d3.selectAll('.row').filter(function(d,i) {
                const cells = d3.select(this).selectAll('.cell')
                var result  = false
                cells.each(function(){
                  var cell = d3.select(this)
                  console.log('cell rel type', cell.attr('link_type'))
                  if (cell.attr('link_type').includes(selected_rel_type)) {
                    result = true
                    
                  }
                })
                return result
              })
              .attr('visibility','visible')

              //after filtering, count how many rows up we are moving
              var first_row = rows_with_rel.filter(function (d, i) { return i === 1;})
              var first_row_index = first_row.attr('nodeid')
              //get translate of that row and find the order
              var first_translateY = get_translate_from_index(first_row_index)[1]
              //x_positions is equal to order + 1
              var x_positions = first_translateY/20 - 1

              //console.log(rows_with_rel.size())
              //move rows up
              rows_with_rel.each(function(){
                var nodeid = d3.select(this).attr('nodeid')
                move_row_x_positions(nodelist,nodeid,'up',x_positions, 20)
              })

              //shrink background to size x 20
              d3.select(".background").attr("height", rows_with_rel.size() * 20 )

            }) //end on change
            
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
          