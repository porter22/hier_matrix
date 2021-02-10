
function getNodeIndexByName(nodes, nodename) {
  //takes node name, returns index
  for (var j = 0; j < nodes.length; j++) {
    ////console.log("nodes[j]:", nodes[j] );
    ////console.log("nodename:", nodename );
    if (nodename == nodes[j].name) {
      ////console.log(nodename, " found");
      ////console.log("returning ", j);
      return j;
    }
  }
  ////console.log(nodename, " not found");
}

//exports matrix to excel
  //go row by row. for each row:
    //find all cells with link_type not none, get their source and target
    //populate 3D array

//TODO export not only matrix, but the nodelist as well
function export_matrix(matrix, nodelist) {
  var filtered_matrix = []
  var filtered_nodelist = []
  matrix.forEach(function(row, index) {
    //console.log('row:', row)
    if (row['hidden'] === true) {
      console.log('hidden rows indexes:', index)
    } else { //export to excel
      filtered_matrix.push(row)
      filtered_nodelist.push(nodelist[index])
    }
  })

  send_to_flask(filtered_matrix, filtered_nodelist, nodelist)
}

//reorder rows of the matrix, according to the order_list
function reorder_matrix(original_matrix, order_list) {
  var reordered_matrix = []
  order_list.forEach(function(item){
    reordered_matrix.push(original_matrix[item])
  })

  console.log('reordered_matrix:', reordered_matrix)
  return reordered_matrix
}

//reorder rows of the matrix, according to the order_list
function reorder_nodelist(original_nodelist, order_list) {
  var reordered_nodelist = []
  order_list.forEach(function(item){
    reordered_nodelist.push(original_nodelist[item])
  })

  console.log('reordered_nodelist:', reordered_nodelist)
  return reordered_nodelist
}



function send_to_flask(input_data, filtered_nodelist, full_nodelist) {
  $.ajax({
    type: "POST",
    contentType: "application/json;charset=utf-8",
    url: "/",
    traditional: "true",
    data: JSON.stringify({input_data, filtered_nodelist, full_nodelist}),
    dataType: "json"
    });
}

function highlight_row(selectedindex) {
  //reset all previous lines
  d3.selectAll('line').style('stroke', 'white')

  console.log('selected index:', selectedindex)

  //find corresponding line and next line 

  var this_or_next_row = d3.selectAll('.row').filter( function( d, i ) {
     var cur_row_id = parseInt(d3.select(this).attr('nodeid'))
     var visibility = d3.select(this).attr('visibility')
     console.log('checking nodeid:', cur_row_id, selectedindex, visibility)
     if (cur_row_id == selectedindex || cur_row_id == selectedindex + 1) {
       if (visibility !== 'hidden')
        return true
     }
  })

  //.. and highlight it
  this_or_next_row.select('line').style('stroke','black')
}


function remove_empty_rows(original_order, cell_height, matrix, nodelist) {
  //REMOVING EMPTY ROWS
  //find hidden row indeces
  var hidden_rows = find_rows_visible_or_hidden('hidden');
  //console.log('hidden rows:', hidden_rows)
  //console.log('nodelist in remove empty rows:', nodelist)
  
  //remove hidden rows from order list
  updated_order = original_order.filter( function( el ) {
    return !hidden_rows.includes( el );
  } );

  //update the matrix value of hidden
  hidden_rows.forEach(function(row) {
    //console.log('row.index:', row)
    matrix[row]['hidden'] = true;
    //console.log('matrix[row]:',matrix[row])
  })

  
  //console.log('original order:', original_order)
  //console.log('updated order:', updated_order)
  
  update_rows_translate(updated_order); //this moves rows along Y altogether

  update_cols_translate(updated_order); //this moves just the axis names

  update_cells_translate(updated_order, nodelist); //this should move cells along X
  
  //shrink background
  let new_bg_height = updated_order.length * cell_height;
  d3.select('.background').attr('height',new_bg_height)
  d3.select('.background').attr('width',new_bg_height)

}

//move cells along X axis according to the specified order of nodes
function update_cells_translate(order_list, nodelist) {

  for (var i = 0; i < order_list.length; i++) {
  
  //console.log('nodelist:', nodelist)
  //get name of the node
  var nodename = nodelist[order_list[i]].name
  console.log('nodename:', nodename)

  d3.selectAll('.cell').filter(function(d,i) {
    var target = d3.select(this).attr('target')
    if (target === nodename) {
      console.log('found the cell.')
      return true
    }
  })
  .attr('x', i*10 + 5); //i*10 + 5
  //.style('fill', 'black');
}

  //var upd_translate = i * 10 + 5//TODO: fix this

}



//given checkbox value and visibility setting, change visibility of the row in the matrix
function change_rows_visibility(checkbox_value, visibility, filter_type) {
  var selected_rows = []
  //if entities are filtered
  if (filter_type === 'entities') {
    //select rows with that domain
    selected_rows = d3.selectAll('.row').filter(function(d,i) {
      var cur_row_type = d3.select(this).attr('type')
      
      if ( cur_row_type === checkbox_value) {
        return true
      }
    })
    //if relationships are filtered
  } else if (filter_type === 'relationships') {
    selected_rows = d3.selectAll('.row').filter(function(d,i) {
      const cells = d3.select(this).selectAll('.cell')
      var result  = false
      cells.each(function(){
        var cell = d3.select(this)
        console.log('cell rel type', cell.attr('link_type'))
        if (cell.attr('link_type').includes(checkbox_value)) 
        result = true
      })
      return result
    })
  } else if (filter_type === 'empty') {
    console.log('empty rows are filtered')
    selected_rows = d3.selectAll('.row').filter(function(d,i) {
      const cells = d3.select(this).selectAll('.cell')
      var result  = true
      cells.each(function(){
        var cell = d3.select(this)
        console.log('cell rel type', cell.attr('link_type'))
        if (cell.attr('link_type') != 'none') 
          result = false
      })
      return result
    })



  }
  
  selected_rows.attr('visibility', visibility)

}


function change_cols_visibility(row_indexes, visibility) {

  var selected_cols = d3.selectAll(".column").filter(function(d,i) {
    if (row_indexes.includes(i) )
      return true
  })
  .attr('visibility', visibility)
}

//finds all the rows with "visibility" attribute set as "hidden" or 'visible'
function find_rows_visible_or_hidden(visibility) {
  var result = []
  
  var hidden_rows = d3.selectAll('.row').filter(function(d,i) {
    var row_visibility = d3.select(this).attr('visibility')
    
    if (row_visibility === visibility)
    return true
  })
  
  hidden_rows.each(function(d){
    var row_id = d3.select(this).attr('nodeid');
    result.push(parseInt(row_id))
  })
  
  return result
}

//for each row in order_list, set translate attribute
function update_rows_translate(order_list) {
  
  for (var i = 0; i < order_list.length; i++) {
    //find row with that nodeid
    var cur_row_index = order_list[i]
    
    //get this row's selection in the matrix
    var cur_row = d3.selectAll('.row').filter(function(d,i) {
      var row_id = d3.select(this).attr('nodeid')
      
      if (row_id == cur_row_index)
      return true
    })
    
    var upd_translate = i * 10 //TODO: fix this
    
    console.log('changing translate for row: ', cur_row_index, ' to ', upd_translate)
    
    cur_row.attr('transform', "translate(0," + upd_translate + ")")
    
  }
  
}

//for each row in order_list, set translate attribute
function update_cols_translate(order_list) {
  
  for (var i = 0; i < order_list.length; i++) {
    //find row with that nodeid
    var cur_row_index = order_list[i]
    
    //get this row's selection in the matrix
    var cur_row = d3.selectAll('.column').filter(function(d,i) {
      var row_id = d3.select(this).attr('nodeid')
      
      if (row_id == cur_row_index)
      return true
    })
    
    var upd_translate = i * 10 + 5//TODO: fix this
    
    console.log('changing translate for column: ', cur_row_index, ' to ', upd_translate)
    
    cur_row.attr('transform', "translate(" + upd_translate + ")rotate(-90)")
    //.attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
    
  }
  
}



//not dependent on order, but updates order field
//moves row with given node index by x rows in the given direction up/down
function move_row_x_positions(nodelist, nodeindex, direction, x, row_height) {
  console.log('moving row', nodelist[nodeindex], ' ', direction, ' for ', x, 'positions')
  
  //get current row
  let cur_row = d3.selectAll('.row')
  .filter(function(d,i){
    return i == nodeindex;
  })
  
  dir_multiplier = 1;
  if (direction == "down")
  dir_multiplier = -1;
  
  //get current translate y from current row  
  cur_row.attr('transform',function(d,i){
    let cur_translate_y = get_translate_from_index(nodeindex)[1]
    
    let move_y = cur_translate_y - x * row_height * dir_multiplier
    
    return "translate("+ 0 +","+ move_y + ")";
  })
  
  //change order values
  nodelist[nodeindex].order = nodelist[nodeindex].order - x * dir_multiplier
  //console.log(nodelist[nodeindex], ' gets new order', nodelist[nodeindex].order) 
  
}

function switch_selected_rows (order_list, direction, matrix, nodelist){
  var selected = d3.select(".selected")
  var nodeid = parseInt(selected.attr('nodeid'))
  var order_index = order_list.indexOf(nodeid)
  console.log('order_index',order_index)

  //switch selected element with the next/prev one in the order list
  if (direction === 'down') {
    //if not the last element
    if (order_index < order_list.length - 1) { 
      order_list = switch_neighbour(direction, order_list, order_index)
    }
  } else {
    //if not the first element
    if (order_index > 0) {
      order_list = switch_neighbour(direction, order_list, order_index)
    }
  }
  
  //reposition rows according to their order
  update_rows_translate(order_list);

  //reorder matrix accordingly
  reorder_matrix(matrix, order_list)

  //reorder nodelist accordingly
  reorder_nodelist(nodelist, order_list)
  
}

//switch two elements in the array, depending on the direction
//up - with previous element
//down - with next element 
function switch_neighbour(direction, order_list, order_index) {
  var vector = 1 
  if (direction === 'up')
    vector = -1

  var tmp = order_list[order_index];
      order_list[order_index] = order_list[order_index + vector];
      order_list[order_index + vector] = tmp;
      console.log('direction:',direction,' switched order list:', order_list)
  
  return order_list
}

function move_selected_rows(nodelist, direction, row_height) {
  //moves selected rows up or down
  //direction - "up" or "down"
  
  //finds next element of the same level - do that for ordered nodelist
  function get_next_domain(ordered_nodelist, sel_node_index, direction, sel_node_level) {
    //get node level of the selected row
    var same_level_nodes = []
    var sel_node_index_same = 0
    
    ordered_nodelist.forEach(function(node, index) {
      if (node.level == sel_node_level) {
        same_level_nodes.push(node)
        if (node.index == sel_node_index)
        sel_node_index_same = same_level_nodes.length - 1
      }
    });
    console.log('same level nodes', same_level_nodes)
    if (direction == 'up' && sel_node_index_same > 0) {
      console.log(same_level_nodes[sel_node_index_same - 1])
      return same_level_nodes[sel_node_index_same - 1]
    }
    else if (direction == 'down' && sel_node_index_same < same_level_nodes.length - 1) {
      console.log(same_level_nodes[sel_node_index_same - 1])
      return same_level_nodes[sel_node_index_same + 1]
    }
    
  }
  
  //reorder the nodelist accoring to the order field
  function get_ordered_nodelist(nodelist) {
    let ordered = Array.from(nodelist) 
    ordered.sort(compare)
    console.log('ordered:', ordered)
    return ordered
  }
  
  function compare(a, b) {
    console.log("a:",a," and b:", b)
    if (a.order > b.order) return 1;
    if (b.order > a.order) return -1;
    
    return 0;
  }
  
  var ordered_nodelist = get_ordered_nodelist(nodelist);
  
  var selected = d3.select(".selected")
  
  var string = selected.attr("transform")
  var translate = string.substring(string.indexOf("(")+1, string.indexOf(")")).split(",");
  //console.log("selected element translateY:", translate[1])
  
  var node_index = parseInt(selected.attr('nodeid'))
  //if the selected row is not a leaf node, move all descendants together 
  var nodes_to_move = []
  if (nodelist[node_index].collapsed == false) //NOT CHECKED
  nodes_to_move = Array.from(nodelist[node_index].descendants_list);
  nodes_to_move.push(nodelist[node_index])
  console.log('nodes to move:', nodes_to_move)
  var sel_node_level = nodelist[node_index].level
  
  //determine new y position
  if (direction === 'up')
  direction_multiplier = - 1 * row_height
  else if (direction === 'down')
  direction_multiplier = row_height
  
  if (sel_node_level < 1){
    //find next/previous same level element
    next_same_level = get_next_domain(ordered_nodelist, node_index, direction, sel_node_level)
    console.log('next same level node is ', next_same_level)
    //swap domains
    //move selected node with all its descendants up/down for next_domain.descendants rows
    num_move_rows = next_same_level.descendants + 1 //the number of rows to move = number of descendants of next domain + domain element itself
    for (let i = 0; i < nodes_to_move.length; i += 1) {
      move_row_x_positions(nodelist, nodes_to_move[i].index, direction, num_move_rows, row_height);
    }
    //move next domain elements after last descendant of selected node
    //get selected node descendants count
    var other_num_move_rows = 1
    if (nodelist[node_index].collapsed == false) //NOT CHECKED
    other_num_move_rows = nodelist[node_index].descendants + 1
    other_nodes_to_move = Array.from(next_same_level.descendants_list)
    other_nodes_to_move.push(next_same_level)
    console.log('other nodes to move:', other_nodes_to_move)
    if (direction=='up')
    other_direction = 'down'
    else if (direction=='down')
    other_direction = 'up'
    for (let i = 0; i < other_nodes_to_move.length; i += 1) {
      move_row_x_positions(nodelist, other_nodes_to_move[i].index, other_direction, other_num_move_rows, row_height);
    }
  } else { //if leaf nodes
    var new_y = parseInt(translate[1]) + direction_multiplier
    console.log("new_y", new_y)
    
    //push neighbour element down
    transform_string = "translate(0," + (new_y) + ")"
    d3.selectAll('.row').filter(function(d, i) { 
      if (d3.select(this).attr('transform') == transform_string)
      return true; })
      //.attr('opacity','0.5')
      .attr("transform", function(d, i) { 
        //////console.log("selected row has index", d)
        return "translate(0," + (new_y-direction_multiplier) + ")"; })
        
        d3.select(".selected").attr("transform", function(d, i) { 
          ////console.log("selected row has index", d)
          return "translate(0," + new_y + ")"; })
          .classed('.selected', false);
        }
        
      }
      
      
      //adapted from: https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
      /*
      function draw_tree(root_data, height, width, svg) {
        
        var i = 0,
        duration = 750;
        
        // declares a tree layout and assigns the size
        var treemap = d3.tree().size([height/2, width]);
        
        root = d3.hierarchy(root_data, function(d) { return d.children; });
        root.x0 = height / 2;
        root.y0 = 0;
        
        // Collapse after the second level
        //root.children.forEach(collapse);
        
        update(root);
        
        // Collapse the node and all it's children
        function collapse(d) {
          if(d.children) {
            d._children = d.children
            d._children.forEach(collapse)
            d.children = null
          }
        }
        
        function collapse_new(d) {
          if(d.children) {
            d._children = d.children
            d._children.forEach(collapse)
            d.children = null
          }
        }
        
        
        
        function update(source) {
          //console.log("source:", source)
          // Assigns the x and y position for the nodes
          //var treeData = treemap(source);
          var treeData = treemap(root)
          
          // Compute the new tree layout.
          var nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);
          
          // Normalize for fixed-depth.
          nodes.forEach(function(d){ d.y = d.depth * 180});
          
          // ****************** Nodes section ***************************
          
          // Update the nodes...
          var node = svg.selectAll('g.node')
          .data(nodes, function(d) {return d.id || (d.id = ++i); });
          
          // Enter any new modes at the parent's previous position.
          var nodeEnter = node.enter().append('g')
          .attr('class', 'node')
          .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
          })
          .on('click', click);
          
          // Add Circle for the nodes
          nodeEnter.append('circle')
          .attr('class', 'node')
          .attr('r', 1e-6)
          .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
          });
          
          // Add labels for the nodes
          nodeEnter.append('text')
          .attr("dy", ".35em")
          .attr("x", function(d) {
            return d.children || d._children ? -13 : 13;
          })
          .attr("text-anchor", function(d) {
            return d.children || d._children ? "end" : "start";
          })
          .text(function(d) { return d.data.name; });
          
          // UPDATE
          var nodeUpdate = nodeEnter.merge(node);
          
          // Transition to the proper position for the node
          nodeUpdate.transition()
          .duration(duration)
          .attr("transform", function(d) { 
            return "translate(" + d.y + "," + d.x + ")";
          });
          
          // Update the node attributes and style
          nodeUpdate.select('circle.node')
          .attr('r', 2)
          .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
          })
          .attr('cursor', 'pointer');
          
          
          // Remove any exiting nodes
          var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
          })
          .remove();
          
          // On exit reduce the node circles size to 0
          nodeExit.select('circle')
          .attr('r', 1e-6);
          
          // On exit reduce the opacity of text labels
          nodeExit.select('text')
          .style('fill-opacity', 1e-6);
          
          // ****************** links section ***************************
          
          // Update the links...
          var link = svg.selectAll('path.treelink')
          .data(links, function(d) { //console.log(d)
            return d.id; });
            
            // Enter any new links at the parent's previous position.
            var linkEnter = link.enter().insert('path', "g")
            .attr("class", "treelink")
            .attr("source", function(d,i) {
              return d.parent.data.name 
            })
            .attr("target", function(d,i) {
              return d.data.name
            })
            //add source and target attributes
            .attr('d', function(d){
              var o = {x: source.x0, y: source.y0}
              return diagonal(o, o)
            });
            
            // UPDATE
            var linkUpdate = linkEnter.merge(link);
            
            // Transition back to the parent element position
            linkUpdate.transition()
            .duration(duration)
            .attr('d', function(d){ return diagonal(d, d.parent) });
            
            // Remove any exiting links
            var linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', function(d) {
              var o = {x: source.x, y: source.y}
              return diagonal(o, o)
            })
            .remove();
            
            // Store the old positions for transition.
            nodes.forEach(function(d){
              d.x0 = d.x;
              d.y0 = d.y;
            });
            
            // Creates a curved (diagonal) path from parent to the child nodes
            function diagonal(s, d) {
              
              path = `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`
              
              return path
            }
            
            // Toggle children on click.
            function click(d) {
              if (d.children) {
                d._children = d.children;
                d.children = null;
              } else {
                d.children = d._children;
                d._children = null;
              }
              
              update(d);
            }
          }
          
        }
        */
        
        function getNodeListfromTree(nodes, nodelist, current_level) {
          //take json tree, return a flat list of nodes
          ////console.log("getting a flat node list");
          for (var j = 0; j < nodes.length; j++) {
            //find all domainnodes and their children
            //var newNode = new Object();
            //newNode.name = nodes[j].name
            nodes[j].level = current_level
            nodelist.push(nodes[j])
            if (nodes[j].hasOwnProperty("children")) {
              ////console.log("has property children");
              getNodeListfromTree(nodes[j].children, nodelist, current_level + 1);
            }
          }
          return nodelist
        }
        
        function doesPathExist(start, dest, path) {
          //path - a list of nodes in a path between start and dest
          //var children = start.children; //list of direct children nodes
          path.push(start);
          printPath(path);
          //console.log("children of node ", start.name, "are: ", start.children);
          //console.log("searching for dest: ", dest.name);
          //check if dest node is in current node children list
          if (start.children) {
            const found = start.children.some(child => child.name === dest.name);
            //const found = start.children.some(child => child.name === "subrequirement1-1");
            //console.log("found?:", found);
            if (found) {
              return path
            } else {
              for (var j = 0; j < start.children.length; j++)
              doesPathExist(start.children[j], dest, path);
            }
          } else {
            path.pop();
          }
          //if isDestInChildren(start.children)
        }
        
        function getNeighbors (node, links) {
          neighbors = []
          for (var i = 0; i < links.length; i += 1) {
            var neighbor = new Object();
            if (links[i].source == node.name) {
              neighbor.name = links[i].target
              neighbors.push(neighbor);
            } else if (links[i].target == node.name) {
              neighbor.name = links[i].source
              neighbors.push(neighbor);
            }
          }
          ////console.log("node: ", node.name, " has these neighbors:", neighbors);
          return neighbors;
        }
        
        function getIndexedLinks(links, nodelist) {
          var result_links = [];
          //console.log("nodelist:", nodelist);
          for (var i = 0; i < links.length; i += 1) {
            var rlink = new Object();
            var isource = getNodeIndexByName(nodelist, links[i].source)
            var itarget = getNodeIndexByName(nodelist, links[i].target)
            ////console.log("ilink:", isource, itarget);
            rlink.source = isource;
            rlink.target = itarget;
            rlink.value = links[i].value;
            ////console.log("rlink:", rlink.source, rlink.target);
            result_links.push(rlink);
            ////console.log("rlink:", rlink);
            ////console.log("indexedLinks:", result_links);
          }
          return result_links;
        }
        
        function inverse_rel(rel_type) {
          console.log('link type:', rel_type)
          //var result = Object.assign("", link_type);
          var inv_rel_type = ""
          if (rel_type.includes("<")) {
            inv_rel_type = rel_type.replace("<",">")
          } else if (rel_type.includes(">")) {
            inv_rel_type = rel_type.replace(">","<")
          }
          console.log('inversed link type:', inv_rel_type)
          return inv_rel_type
        }
        
        function getLinkColorType(source, target, links) {
          ////console.log("enter params:", source, target, links);
          var dict = {
            "none":"gray",
            "=same":"black",
            ">allocated_to":"#845EC2",
            "<allocated_to":"#D65DB1",
            ">verified_by":"#FF6F91",
            "<verified_by":"#FF9671",
            ">satisfies":"#FFC75F",
            "<satisfies":"#F9F871" };
            
            var result = []
            var rel_type, inv_rel_type = ""
            for (var i = 0; i < links.length; i += 1) {
              rel_type = links[i].value
              
              if (links[i].source == source && links[i].target == target) {
                result =  [dict[rel_type], rel_type] 
              } else if (links[i].source == target && links[i].target == source) {
                //inverse signs
                if (rel_type.includes("<")) {
                  inv_rel_type = rel_type.replace("<",">")
                } else if (rel_type.includes(">")) {
                  inv_rel_type = rel_type.replace(">","<")
                }
                ////console.log("rel_type:", rel_type)
                ////console.log("inv_rel_type:", inv_rel_type)
                result = [dict[inv_rel_type], inv_rel_type]
              }
            }
            
            ////console.log("returning result:", result)
            return result
          }
          
          function printPath(path) {
            var s = "";
            for (var i = 0; i < path.length; i += 1) {
              s += path[i] + "->";
            }
            //console.log("current path: ", s);
          }
          
          //COLLAPSING FUNCTIONALITY
          function collapse(node) {
            console.log("collapsing node: ", node);
            if (node.children) {
              //  //console.log("node has children ");
              //check if we can work directly with children
              node._children = node.children;
              node._children.forEach(collapse);
              //node._children.forEach(hideInParent);
              node._children.forEach(hide_row);
              //node._children.forEach(updateLastDesc); //set last descendant
              
              //node.children = null;
              node.collapsed = true;
            }
          }
          
          //sets visibility as hidden to the given row
          function hide_row(node) {
            console.log('hiding node..', node)
            
            //find corresponding row in the matrix
            var row_to_hide = d3.selectAll('.row').filter(function(d,i) {
              var cur_row_index = parseInt(d3.select(this).attr('nodeid')) 
              if (node.index == cur_row_index)
              return true
            })
            
            row_to_hide.attr('visibility', 'hidden')
          }
          
          //sets visibility as hidden to the given row
          function show_row(node) {
            console.log('showing node..', node)
            
            //find corresponding row in the matrix
            var row_to_show = d3.selectAll('.row').filter(function(d,i) {
              var cur_row_index = parseInt(d3.select(this).attr('nodeid')) 
              if (node.index == cur_row_index)
              return true
            })
            
            updated_order.push(node.index)
            
            row_to_show.attr('visibility', 'visible')
          }
          
          function compare_numbers(a, b) {
            return a - b;
          }
          
          
          
          function decollapse(node) {
            //  //console.log("decollapsing node:", node);
            ////console.log("current nodeSelection: ", nodeSelection, "collapsed", nodeSelection.collapsed);
            if (node._children) {
              node.children = node._children;
              /*for (var i = 0; i < node._children.length; i += 1)
              decollapse(node._children[i])
              for (var i = 0; i < node._children.length; i += 1)
              restoreCoords(node._children[i]) */
              node.children.forEach(show_row);
              //node.children.forEach(push_below_rows_once);
              node.children.forEach(decollapse);
              //node.children.forEach(restoreCoords);
              //moveRestRows(node._children[node._children.length - 1], node._children.length, "down");
              //node._children = null;
              node.collapsed = false;
            }
          }
          
          
          function get_translate_from_index(nodeindex) {
            var string = d3.selectAll('.row')
            .filter(function(d,i){
              return i == nodeindex;
            })
            .attr("transform");
            return get_translate_from_string(string);
          }
          
          function get_translate_from_string(string) {
            return string.substring(string.indexOf("(")+1, string.indexOf(")")).split(",")
          }
          
          
          function set_descendants(node) {
            ////console.log("setting descendants for node:", node);
            if (node.children) {
              ////console.log(" has children:");
              for (var i = 0; i < node.children.length; i += 1) {
                set_descendants(node.children[i])
                node.descendants_list.push(node.children[i])
                node.descendants = node.descendants + node.children[i].descendants + 1
                ////console.log("  descendants for node:", node, "are now equal to:", node.descendants);
              }
            } else node.descendants = 0
          }
          
          function get_top_nodes(nodelist) {
            ////console.log("getting top nodes from nodelist:", nodelist)
            var result =  []
            nodelist.forEach(function(node) {
              if (node.level == 0)
              result.push(node)
            });
            ////console.log("top nodes:", result)
            return result;
          }

          //ANCHOR LINK AGGREGATION
          
          //TODO need to check all ancestors
          function add_ancestor_links(links, nodelist) {
            ////console.log("adding top links to the links array", links)
            var result =  []
            links.forEach(function(link) {
              //if source has parent, make link between parent and target
              //var parentID = getNodeIndexByName(nodelist,link.source).parentID
              //make link with parent
              console.log("checking top level link:", link)
              
              var source_ancestors = find_all_ancestors(link.source, nodelist)
              console.log("ancestors of source:", source_ancestors)
              
              var target_ancestors = find_all_ancestors(link.target, nodelist)
              console.log("ancestors of target:", target_ancestors)
              
              //make links between all ancestors
              var new_links = []
              source_ancestors.forEach(function(source_ancestor) {
                target_ancestors.forEach(function(target_ancestor) {
                  new_links.push(make_link(source_ancestor, target_ancestor, link.value))
                })
              })

              console.log("new_links", new_links)
              result = result.concat(new_links)

            });
            //console.log("added ancestor links:", result)
            return result;
          }

          function find_all_ancestors(node, nodelist) {
            var result = []
            console.log('finding all ancestors for :', node)

            if (node === 's2') 
              console.log('see here')

            //if node has parent, find all ancestors
            var parent_id = get_parent_id(node, nodelist)
            
            console.log('  parent_id :', parent_id)
            
            //if node has parent
            if (parent_id != -1 && parent_id || parent_id == 0) {
              var parents = find_all_ancestors(nodelist[parent_id].name, nodelist)
              result.push(node)  
              //result.push(nodelist[parent_id].name
              result = result.concat(parents)
            } 

            result.push(node)  
    
            
            //console.log('  result so far :', parent_id)
            return result
          }

          function make_link(source, target, link_value) {
            
            var new_link = {}
            new_link.source = source
            new_link.target = target
            new_link.value = link_value
          
            return new_link;
          }

          /*function make_links_with_ancestors(node_name, ancestors, link_value) {
            var results = []
            ancestors.forEach(function(ancestor) {
              var new_link = {}
              new_link.source = node_name
              new_link.target = ancestor
              new_link.value = link_value
              results.push(new_link)
            })
          
            return results;
          }*/
          
          function get_parent_id(nodename, nodelist)  {
            //returns parent of a node
            var result = -1
            for (var i = 0; i < nodelist.length; i += 1) {
              var node = nodelist[i];
              //console.log("checking node:", node.name, "against ", nodename)
              if (nodename === node.name) {
                //console.log("nodename is equal, returning node", node.parentID);
                result = node.parentID
                //return node.parentID;
                return result
              }
            };
            return result
          }
          /*  nodelist.forEach(function(node) {
            ////console.log("node is:", node.name)
            ////console.log("nodename is:", nodename)
            if (nodename === node.name)
            //console.log("nodename is equal, returning node", node.parentID);
            return node.parentID;
          });
          */
          
          function getSelectionCoords(selection) {
            var t = d3.transform(selection.attr("transform")),
            x = t.translate[0],
            y = t.translate[1];
            ////console.log("returning:",x,y)
            return [x, y];
          }
          
          function getSelectionCoords_v4(selection) {
            string = selection.attr("transform");
            translate = string.substring(string.indexOf("(")+1, string.indexOf(")")).split(",");
            ////console.log("returning:",translate[0],translate[1])
            return [translate[0], translate[1]];
          }
          
          
          //stores value of previous coordinates before moving the rows - will use later when decollapsing
          function savePrevCoords(nodeindex, current_x, current_y) {
            var row_selection = getRowSelection(nodeindex);
            row_selection.attr("prev_x", current_x);
            row_selection.attr("prev_y", current_y);
          }
          
          
          
          //move back row to previous position
          function restoreCoords(node) {
            ////console.log("restoring coordinates for node:", node);
            var row_selection = getRowSelection(node.index);
            prev_x = row_selection.attr("prev_x");
            prev_y = row_selection.attr("prev_y");
            
            ////console.log("prev_y:",prev_y);
            
            row_selection.attr('transform', function(){
              //transform = d3.transform(d3.select(this).attr("transform"));
              return "translate(" + prev_x + "," + prev_y + ")";
            });
            
            //show current row
            row_selection.attr("visibility", "visible");
          }
          
          //given node index, return its row selection
          function getRowSelection(nodeindex) {
            var currentNodeSelection =  d3.selectAll(".row")
            .filter(function(d,i){
              return i == nodeindex;
            })
            return currentNodeSelection;
          }
          
          //given node index, return all other rows that are below
          function getBelowSelection(nodeindex) {
            var belowSelection =  d3.selectAll(".row")
            .filter(function(d,i){
              return i > nodeindex;
            })
            return belowSelection;
          }
          
          //adapted from https://mgechev.github.io/javascript-algorithms/graphs_searching_bfs.js.html
          function bfs(graph, startNode, targetNode) {
            var parents = [];
            var queue = [];
            var visited = [];
            var current;
            //console.log("graph, startNode, targetNode:", graph, startNode, targetNode);
            queue.push(startNode);
            parents[startNode] = null;
            visited[startNode] = true;
            while (queue.length) {
              current = queue.shift();
              if (current === targetNode) {
                return buildPath(parents, targetNode);
              }
              for (var i = 0; i < graph.length; i += 1) {
                if (i !== current && graph[current][i] && !visited[i]) {
                  parents[i] = current;
                  visited[i] = true;
                  queue.push(i);
                }
              }
            }
            return null;
          };
          
          function buildPath(parents, targetNode) {
            var result = [targetNode];
            while (parents[targetNode] !== null) {
              targetNode = parents[targetNode];
              result.push(targetNode);
            }
            return result.reverse();
          }
          
          function get_adj_matrix_no_tops(matrix, top_nodes) {
            var result = []
            var counter = 0
            var top_nodes_indeces = []
            top_nodes.forEach(function(top_node){
              top_nodes_indeces.push(top_node.index)
            })
            
            matrix.forEach(function(row){
              new_row=[]
              row.forEach(function(cell){
                if (top_nodes_indeces.includes(counter)) {
                  new_row.push(0)
                } else {
                  new_row.push(cell.z);
                }
              })
              result.push(new_row)
              counter++;
            })
            ////console.log("adj_matrix return:", result)
            return result;
          }
          
          function get_adj_matrix(matrix, top_nodes) {
            var result = []
            var counter = 0
            var top_nodes_indeces = []
            top_nodes.forEach(function(top_node){
              top_nodes_indeces.push(top_node.index)
            })
            
            matrix.forEach(function(row){
              new_row=[]
              row.forEach(function(cell){
                new_row.push(cell.z);
              })
              result.push(new_row)
              counter++;
            })
            ////console.log("adj_matrix return:", result)
            return result;
          }
          
          
          function highlight_path(nodelist, shortestPath) {
            //reset previous highlighting
            //d3.selectAll(".link").attr('stroke', 'black');
            //d3.selectAll(".node").attr('stroke', 'black');
            
            //breakdown shortestPath into couples
            var path_links = []
            for (let i = 0; i < shortestPath.length - 1; i++) {
              var path_link = []
              path_link.push(nodelist[shortestPath[i]].name)
              path_link.push(nodelist[shortestPath[i + 1]].name)
              path_links.push(path_link)
            }
            
            ////console.log("shortest path:", shortestPath);
            ////console.log("path links:", path_links);
            
            //selects edges that have source and targets as shortestPath items
            path_links.forEach(function(cur_link){
              d3.selectAll(".link")
              .filter(function(d) { 
                ////console.log(d);
                return ((d.source.name == cur_link[0] && d.target.name == cur_link[1]) || (d.source.name == cur_link[1] && d.target.name == cur_link[0]) ); 
              })
              .attr("stroke", "red")
              .attr("stroke-width", 1)
            })
            
            //highlight edges on the tree
            //*NOTE this will not work on three and more levels of hierarchy, need to find a way to get domain name, not a parent name
            var highlighted_domains = []
            var separate_nodes = [] //nodes that need to be on the new svg
            ////console.log("shortest path:");
            shortestPath.forEach(function(node_id, index){
              ////console.log(nodelist[node_id].name);
              d3.selectAll("path.treelink") //get all edges that touch given node
              .filter(function(d) {
                if (node_id == d.data.index) {
                  if (!highlighted_domains.includes(d.parent.data.name)) {
                    highlighted_domains.push(d.parent.data.name)
                    return true
                  } else {
                    separate_nodes.push([d,index]) //push node and its order for the generated svg
                    return false
                  }
                }
              })
              .style("stroke", "red")
              .attr("stroke-width", 1);
            })
            
            //console.log("separate nodes:", separate_nodes);
            
            //for each node that comes to already highlighted tree, generate svg, highlight that treelink
            separate_nodes.forEach(function(node){
              //find out the domain of that node
              let svg_name = "svg.".concat(node[0].parent.data.name)
              svg_name = svg_name.replace(/ /g,".") //for case when domain name has spaces
              ////console.log("svg_name:", svg_name)
              var svg_current = d3.selectAll(svg_name);
              //get root data for the new tree
              var svg_data = svg_current.data()
              ////console.log(svg_data[0])
              
              //generate new svg - make a copy of old one
              var svg_new = d3.select("body").append("svg")
              .datum(svg_data)
              .attr("width", svg_current.attr("width"))
              .attr("height", svg_current.attr("height"))
              .style("transform", "translate(" + 0 + "," + 80 + "px) rotate(90deg)")
              //.attr("svg_order", node[1])
              .attr("class", svg_current.attr("class").concat(".generated"));
              
              //update svg order of the subsequent svgs
              d3.selectAll("svg")
              .filter(function(d) {
                if (d3.select(this).attr("svg_order")) 
                if (d3.select(this).attr("svg_order") >= node[1]) 
                return true
              })
              .attr("svg_order", function(d) {
                return parseInt(d3.select(this).attr("svg_order"))  + 1
              })
              
              svg_new.attr("svg_order", node[1]).append("g");
              
              //draw a new tree based on the same data
              draw_tree(svg_data[0], svg_current.attr("height"), svg_current.attr("width"), svg_new);
              
              //color the edges in the newly generated svg
              svg_new.selectAll("path.treelink")
              .filter(function(d) {
                if (node[0].data.name == d.data.name)
                return true
              })
              .style("stroke","green")
            })
            
            //TODO: now reorder svgs according to their svg_order
            
            //select nodes and color them
            shortestPath.forEach(function(vertex, index) {
              d3.selectAll(".node")
              .filter(function(d, i) { 
                //console.log()
                return vertex == i; 
              })
              .attr("stroke", "red");
            })
            
          }
          
          //show tooltip about relationship type on mousehover
          function showLegend(p) {
            //find link that corresponds to that cell
            var cur_cell = d3.selectAll('.cell')
            .filter(function(d,i){
              return (d.x == p.x && d.y == p.y);
            })
            var result = cur_cell.attr("link_type")
            ////console.log("type:", result);
            
            var div = d3.select(".tooltip")
            
            div.transition()		
            .duration(200)		
            .style("opacity", .9);
            
            div .text(result)
            .style("left", (d3.event.pageX - 60) + "px")		
            .style("top", (d3.event.pageY - 30 ) + "px");		   
          }
          
          
          
          /* TODO: 
          - add top nodes links
          - reset/fix color on oneclick
          - reset color on network
          - upload to DO
          - send link
          */