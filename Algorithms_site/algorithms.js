// Work for building the critical path graph from a precedence table ----------------------------------------------------------------------------------------------------------------------
class CriticalGraph{
    constructor(a_name){
        this.name = a_name;
        this.critical_path = [];
        this.connections = [];
        this.activities = [];
        this.nodes = [];
        this.shortest_completion_time = null;
        this.activity_coordinates_set = [];
        this.activity_floats = {};
    }
 
    add_activity(activity){
        this.activities.push(activity);
    }
 
    // Helper functions:---------------------------------------------------------------------------------------------------------------------------------------------------------------------
    build_node_set(){
        var node_set = {}
        for(let j = 0; j < this.activities.length; j++){
            let nodes_precedence = this.activities[j].get_proceding_activities();
            if(!(nodes_precedence.length == 0)){
                if(nodes_precedence.length == 1){
                    if(nodes_precedence[0].activity_name in node_set){
                        node_set[nodes_precedence[0].activity_name].push(null);
                    } else {
                        node_set[nodes_precedence[0].activity_name] = [null];
                    }
                } else {
                    for(let k = 0; k < nodes_precedence.length; k++){
                        for(let l = 0; l < nodes_precedence.length; l++){
                            if(nodes_precedence[l].activity_name != nodes_precedence[k].activity_name){
                                if(nodes_precedence[k].activity_name in node_set){
                                    node_set[nodes_precedence[k].activity_name].push([nodes_precedence[l].activity_name]);
                                } else {
                                    node_set[nodes_precedence[k].activity_name] = [nodes_precedence[l].activity_name];
                                }
                            }
                        }
                    }
                }
            }
           
        }
 
        return node_set;
    }
 
    // Gets all of the activities that needs to connect to the last node in the network
    get_final_activities(){
        let proceding_list = [];
        for(let s = 0; s < this.activities.length; s++){
            let proceding = this.activities[s].get_proceding_activities();
            for(let r = 0; r < proceding.length; r++){
                proceding_list.push(JSON.stringify(proceding[r].activity_name));
            }
        }
 
        let final_activities = [];
        for(let z = 0; z < this.activities.length; z++){
            if(!(proceding_list.includes(JSON.stringify(this.activities[z].activity_name)))){
                final_activities.push(this.activities[z]);
            }
        }
 
        return final_activities;
    }
 
    // This finds if an item occurs in a set of items
    resolve(item, set_of_items){
        for(let i = 0; i < set_of_items.length; i++){
            if(JSON.stringify([item]) == JSON.stringify(set_of_items[i])){
                return false;
            }
        }
 
        return true;
    }
 
    // This builds the subsets which will be used to spot patterns when we build the middle nodes
    build_node_subsets(){
        // Get all of the precedence subsets
        let all_precedence_sets = [];
        for(let i = 0; i < this.activities.length; i++){
            all_precedence_sets.push(this.activities[i].get_proceding_activities());
        }
 
        console.log(all_precedence_sets)
 
        // Building the subsets by organising the collection of subsets
        let subsets = {};
        for(let i = 0; i < this.activities.length; i++){
            subsets[this.activities[i].activity_name] = [];
            for(let j = 0; j < all_precedence_sets.length; j++){
                if(all_precedence_sets[j].includes(this.activities[i])){
                    // We don't want double adds, so if precedence[j] already in the subset, don't add it again
                    if(this.resolve(all_precedence_sets[j], subsets[this.activities[i].activity_name])){
                        subsets[this.activities[i].activity_name].push([all_precedence_sets[j]]);
                    }
                }
            }
        }
        return subsets;
 
    }
 
    build_setsets_list(subset){
        let contains = [];
        let subset_list = [];
 
        for(let i = 0; i < this.activities.length; i++){
            for(let j = 0; j < subset[this.activities[i].activity_name].length; j++){
                if(!(contains.includes(JSON.stringify(subset[this.activities[i].activity_name][j])))){
                    subset_list.push(subset[this.activities[i].activity_name][j]);
                    contains.push(JSON.stringify(subset[this.activities[i].activity_name][j]));
                }
            }
        }
 
        return subset_list;
    }
 
    get_activity_start_node(activity){
        for(let m = 0; m < this.nodes.length; m++){
            if(JSON.stringify(this.nodes[m].supposed_inflows) == JSON.stringify(activity.get_proceding_activities())){
                return this.nodes[m];
            }
        }
 
        return this.nodes[0];
    }
 
    get_activity_end_node(activity, subset, n){
        for(let m = 0; m < this.nodes.length; m++){
            if(JSON.stringify([this.nodes[m].supposed_inflows]) == JSON.stringify(subset[activity.activity_name][n])){
                return this.nodes[m];
            }
        }
    }
 
    sort_final(final){
        let sorted = [];
        let considered = [];
        for(let i = 0; i < final.length; i++){
            let same = [];
            if(!(considered.includes(final[i].activity_name))){
                same.push(final[i]);
                considered.push(final[i].activity_name);
            }
            for(let j = 0; j < final.length; j++){
                if(JSON.stringify(final[i].get_proceding_activities()) == JSON.stringify(final[j].get_proceding_activities()) && !(considered.includes(final[j].activity_name))){
                    considered.push(final[j].activity_name);
                    same.push(final[j]);
                }
            }
 
            if(same.length > 0){
                sorted.push(same);
            }
        }
 
        return sorted;
    }
 
    order_node_set(set){
        for(let i = 0; i < this.activities.length; i++){
            let list_to_sort = set[this.activities[i].activity_name];
            for(let k = 0; k < list_to_sort.length; k++){
                for(let j = 0; j < list_to_sort.length - 1; j++){
                    if(list_to_sort[j][0].length > list_to_sort[j+1][0].length){
                        let temp = list_to_sort[j+1];
                        list_to_sort[j+1] = list_to_sort[j];
                        list_to_sort[j] = temp;
                    }
                }
            }
        }
        console.log(set);
        return set;
    }
 
    // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 
    build_activity_network(){
 
        // Create the first node to start from
        let node1 = new CriticalNode(0);
        this.nodes.push(node1);
 
        // Set the count to name the other nodes
        var count = 1;
 
        // Get the node set which I think will help to build the middle nodes
        var node_set = this.build_node_set();
        var final_activities = this.get_final_activities();
 
        // Get the pairs of nodes in their subsets
        var node_subsets = this.order_node_set(this.build_node_subsets());
        console.log(node_subsets)
 
        // Get the distinct list of subsets
        var subset_list = this.build_setsets_list(node_subsets);
 
        // Create all of the nodes needed for the network
        for(let i = 0; i < subset_list.length; i++){
            let n_node = new CriticalNode(count);
            count += 1;
            n_node.supposed_inflows = subset_list[i][0];
            this.nodes.push(n_node);
        }
 
        // Create the final node to do the last connections needed
        let final_node = new CriticalNode(count);
        count += 1;
        this.nodes.push(final_node);
        final_node.supposed_inflows = final_activities;
 
        //  Make the connections between the nodes
        for(let j = 0; j < this.activities.length; j++){
            let activity = this.activities[j];
            if(!(typeof(node_subsets[activity.activity_name]) == 'undefined')){
                if(node_subsets[activity.activity_name].length > 0){
                    if(node_subsets[activity.activity_name].length == 1){
                        let start = this.get_activity_start_node(activity);
                        let end = this.get_activity_end_node(activity, node_subsets, 0);

                        if(this.activity_coordinates_set.includes(JSON.stringify([start.name, end.name]))){
                            let new_node = new CriticalNode(count);
                            count += 1;
                            this.nodes.push(new_node);
                            new_node.supposed_inflows = this.activities[j];
                            this.connections.push([this.activities[j], start, new_node]);
                            let dummy = new Activity(`Dummy for ${activity.activity_name} to ${node_subsets[activity.activity_name][0]}`, 0)
                            dummy.make_dummy();
                            this.activities.push(dummy);
                            this.connections.push([dummy, new_node, end]);
                            this.activity_coordinates_set.push(JSON.stringify([start.name, end.name]));
                        
                        } else {
 
                            this.connections.push([this.activities[j], start, end])
                            this.activity_coordinates_set.push(JSON.stringify([start.name, end.name]));
                        }
 
                    } else {
                        let start = this.get_activity_start_node(activity);
                        let end = this.get_activity_end_node(activity, node_subsets, 0);
                        this.connections.push([this.activities[j], start, end]);
                        this.activity_coordinates_set.push(JSON.stringify([start.name, end.name]));
 
                        for(let k = 1; k < node_subsets[activity.activity_name].length; k++){
                            let start = end;
                            end = this.get_activity_end_node(activity, node_subsets, k);
                            if(!(this.activity_coordinates_set.includes(JSON.stringify([start.name, end.name])))){
                                let dummy = new Activity(`Dummy for ${activity.activity_name} to ${node_subsets[activity.activity_name][k]}`, 0)
                                dummy.make_dummy();
                                this.activities.push(dummy);
                                this.connections.push([dummy, start, end]);
                                this.activity_coordinates_set.push(JSON.stringify([start.name, end.name]));
                            }
                        }
                    }
                }
            }
        }
 
        // Final nodes connections
        let final_a = this.sort_final(final_activities);
 
        for(let i = 0; i < final_a.length; i++){
            if(final_a[i].length == 1){
                let start = this.get_activity_start_node(final_a[i][0]);
                this.connections.push([final_a[i][0], start, final_node]);
                this.activity_coordinates_set.push(JSON.stringify([start.name, final_node.name]));
            } else {
                let start = this.get_activity_start_node(final_a[i][0]);
                this.connections.push([final_a[i][0], start, final_node]);
                this.activity_coordinates_set.push(JSON.stringify([start.name, final_node.name]));
 
                for(let j = 1; j < final_a[i].length; j++){
                    let new_node = new CriticalNode(count);
                    count += 1;
                    this.connections.push([final_a[i][j], start, new_node]);
                    this.activity_coordinates_set.push(JSON.stringify([start.name, new_node.name]));
                    this.nodes.push(new_node);
 
                    let dummy = new Activity(`Dummy for ${final_a[i].activity_name} to end`, 0);
                    dummy.make_dummy();
                    this.activities.push(dummy);
                    this.connections.push([dummy, new_node, final_node]);
                    this.activity_coordinates_set.push(JSON.stringify([new_node.name, final_node.name]));
                }
            }
        }
 
 
    }
 
    find_critical_path(){
        // Fill out the est times for the nodes
 
        // Can make a dictionary of est and lst
        let est_s = {}; // In form: {node_name: highest_est}
        let largest_value = 0;
        let lst_s = {}; // In form: {node_name: lowest_lst}
 
        // The first node has est 0
        // Highest est into the node becomes the est value for that node
        // est is the previous nodes est + the duration
        for(let i = 0; i < this.nodes.length; i++){
            est_s[this.nodes[i].name] = 0;
        }
 
        for(let i = 0; i < this.connections.length; i++){
            let activity = this.connections[i][0];
            let start_node = this.connections[i][1];
            let end_node = this.connections[i][2];
 
            if(est_s[end_node.name] < (est_s[start_node.name] + activity.duration)){
                est_s[end_node.name] = est_s[start_node.name] + activity.duration;
 
                if(est_s[end_node.name] > largest_value){
                    largest_value = est_s[end_node.name];
                }
            }
 
        }
 
        console.log(est_s);
 
        // fill out the lst times for the nodes
 
        // lst works from the last node where the lst is the est of the end node
        // Choose the lowest lst working backwards
        // the lst is the lst of the previous node - duration
        for(let i = 0; i < this.nodes.length; i++){
            lst_s[this.nodes[i].name] = largest_value;
        }
 
        for(let i = this.connections.length - 1; i >= 0; i--){
            let activity = this.connections[i][0];
            let start_node = this.connections[i][1];
            let end_node = this.connections[i][2];
 
            if(lst_s[start_node.name] > (lst_s[end_node.name] - activity.duration)){
                lst_s[start_node.name] = lst_s[end_node.name] - activity.duration;
            }
        }
 
        console.log(lst_s);
 
 
        // Assign the est and lst to the nodes
        for(let i = 0; i < this.nodes.length; i++){
            let node = this.nodes[i];
            node.est = est_s[node.name];
            node.lst = lst_s[node.name];
        }
 
    }
 
    // Calculates the floats of all activities
    calculate_floats(){
        for(let i = 0; i < this.connections.length; i++){
            let activity = this.connections[i][0];
            let start = this.connections[i][1];
            let end = this.connections[i][2];
 
            if(!activity.is_dummy){
                let float = end.lst - start.est - activity.duration;
                this.activity_floats[activity.activity_name] = float;
            }
        }
    }
 
    get_nodes(){
        return this.nodes;
    }
 
    get_activities(){
        return this.activities;
    }
 
    get_connections(){
        return this.connections;
    }
}
 
 
class CriticalNode{
    constructor(a_name){
        this.name = a_name;
        this.est = null;
        this.lst = null;
        this.inflows = [];
        this.outflows = [];
        this.supposed_inflows = [];
    }
 
    add_inlfow(node){
        this.inflows.push(node);
    }
 
    add_outflow(node){
        this.outflows.push(node);
    }
 
    add_supposed_inflow(node){
        this.supposed_inflows.push(node);
    }
 
}
 
 
class Activity{
    constructor(a_name, a_duration){
        this.activity_name = a_name;
        this.duration = a_duration;
        this.proceded_by = [];
        this.is_dummy = false;
    }
 
    add_preceding_activity(actvity){
        this.proceded_by.push(actvity);
    }
 
    get_proceding_activities(){
        return this.proceded_by;
    }
 
    make_dummy(){
        this.is_dummy = true;
    }
}
 
 
class DijkstraGraph{
    constructor(a_name){
        this.name = a_name;
        this.nodes = [];
        this.shortest_time = null;
        this.shortest_path = [];
        this.connections = {};
    }
}
 
 
class DijkstraNode{
    constructor(a_name){
        this.name = a_name;
        this.temporary_label = null;
        this.permenant_label = null;
        this.on_path = false;
    }
}
 
// functions for drawing ---------------------------------------------------------------------------------------------------------------------------------------------------------
 
function connect(div1, div2, color, thickness, dummy, start, end) { // draw a line connecting elements
    // bottom right
    if(start % 2 == 0){
        var x1 = 75 + parseInt(div1.style.left.split('p')[0]);
        var y1 = 235 + (parseInt(div1.style.top.split('p')[0]));
    } else {
        var x1 = 75 + parseInt(div1.style.left.split('p')[0]);
        var y1 = 113 + (parseInt(div1.style.top.split('p')[0]));
    }
 
    // top right
    if(end % 2 == 0){
        var x2 = 75 + parseInt(div2.style.left.split('p')[0]);
        var y2 = 235 + (parseInt(div2.style.top.split('p')[0]));
    } else {
        var x2 = 75 + parseInt(div2.style.left.split('p')[0]);
        var y2 = 113 + (parseInt(div2.style.top.split('p')[0]));
    }
 
    var length = Math.sqrt(((x2-x1) * (x2-x1)) + ((y2-y1) * (y2-y1)));
    // center
    var cx = ((x1 + x2) / 2) - (length / 2);
    var cy = ((y1 + y2) / 2) - (thickness / 2);
    // angle
    var angle = Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);
    //style
    let style = "solid";
    if(dummy){
        style = "dotted";
        color = "white";
    }
    // make hr
    var htmlLine = "<div style='padding:0px; margin:0px; height:" + thickness + "px; border-style:"+ style +"; background-color:" + color + "; line-height:1px; position:absolute; left:" + cx + "px; top:" + cy + "px; width:" + length + "px; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform:rotate(" + angle + "deg);' />";
    //
    // alert(htmlLine);
    document.body.innerHTML += htmlLine;
}
 
function draw(nodes, connections, activities, floats){
    let canvas = document.getElementById("view_window");
 
    for(let i = 0; i < nodes.length; i++){
        // Create node graphic
        let node = document.createElement("div");
        let activity_name = document.createElement("p");
        activity_name.innerHTML = nodes[i].name;
        let est = document.createElement("p");
        est.innerHTML = `EST: ${nodes[i].est}`;
        let lst = document.createElement("p");
        lst.innerHTML = `LST: ${nodes[i].lst}`;
 
        node.classList.add("network_node");
        identifier = "activity_" + JSON.stringify(nodes[i].name);
        node.id = identifier;
        activity_name.classList.add("activity_name");
        est.classList.add("est");
        lst.classList.add("lst");
 
        if(i % 2 == 0){
            node.style.top = "100px";
        }else{
            node.style.top = "400px";
        }
 
        node.style.left = `${20 + 210*((i - (i%2)) / 2)}px`;
 
        node.appendChild(activity_name);
        node.appendChild(est);
        node.appendChild(lst);
        canvas.appendChild(node);
    }
 
    // Draw the lines
    for(let j = 0; j < connections.length; j++){
        let activity_name = connections[j][0].activity_name;
        let start = connections[j][1].name;
        let end = connections[j][2].name;
        let is_dummy = connections[j][0].is_dummy;
        let start_node_id = document.getElementById("activity_" + JSON.stringify(connections[j][1].name));
        let end_node_id = document.getElementById("activity_" + JSON.stringify(connections[j][2].name));
 
        connect(start_node_id, end_node_id, "black", 0.1, is_dummy, start, end);
    }
 
    // Put the floats onto the site
    let adder = document.getElementById("actions");
 
    for(let i = 0; i < activities.length; i++){
        if(!activities[i].is_dummy){
            let activity_float = document.createElement("p");
            activity_float.innerHTML = `Float for ${activities[i].activity_name} is ${floats[activities[i].activity_name]}`;
 
            adder.appendChild(activity_float);
        }
    }
}
// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 
function main(){
    // Test 1:
    // var a = new Activity("A", 3)
    // var b = new Activity("B", 7)
    // var c = new Activity("C", 5)
    // var d = new Activity("D", 10)
    // var e = new Activity("E", 4)
    // var f = new Activity("F", 2)
    // var g = new Activity("G", 4)
 
    // c.add_preceding_activity(a);
    // d.add_preceding_activity(b);
    // d.add_preceding_activity(c);
    // e.add_preceding_activity(a);
    // f.add_preceding_activity(e);
    // f.add_preceding_activity(d);
    // g.add_preceding_activity(d);
 
    // var practice_graph = new CriticalGraph("trial");
    // practice_graph.add_activity(a);
    // practice_graph.add_activity(b);
    // practice_graph.add_activity(c);
    // practice_graph.add_activity(d);
    // practice_graph.add_activity(e);
    // practice_graph.add_activity(f);
    // practice_graph.add_activity(g);
 
    // practice_graph.build_activity_network();
 
    // console.log(practice_graph.get_nodes());
    // console.log(practice_graph.get_connections());
    // console.log(practice_graph.get_activities());
 
    // practice_graph.find_critical_path();
    // practice_graph.calculate_floats();
 
    // Test 2:
    // var a = new Activity("A", 4)
    // var b = new Activity("B", 1)
    // var c = new Activity("C", 3)
    // var d = new Activity("D", 2)
    // var e = new Activity("E", 7)
    // var f = new Activity("F", 8)
    // var g = new Activity("G", 5)
    // var h = new Activity("H", 3)
    // var i = new Activity("I", 6)
    // var j = new Activity("J", 7)
    // var k = new Activity("K", 6)
 
    // d.add_preceding_activity(a);
    // e.add_preceding_activity(b);
    // f.add_preceding_activity(c);
    // g.add_preceding_activity(c);
    // h.add_preceding_activity(d);
    // i.add_preceding_activity(d);
    // i.add_preceding_activity(e);
    // i.add_preceding_activity(f);
    // j.add_preceding_activity(g);
    // j.add_preceding_activity(i);
    // k.add_preceding_activity(g);
    // k.add_preceding_activity(i);
 
    // var practice_graph = new CriticalGraph("trial");
    // practice_graph.add_activity(a);
    // practice_graph.add_activity(b);
    // practice_graph.add_activity(c);
    // practice_graph.add_activity(d);
    // practice_graph.add_activity(e);
    // practice_graph.add_activity(f);
    // practice_graph.add_activity(g);
    // practice_graph.add_activity(h);
    // practice_graph.add_activity(i);
    // practice_graph.add_activity(j);
    // practice_graph.add_activity(k);
 
    // practice_graph.build_activity_network();
 
    // console.log(practice_graph.get_nodes());
    // console.log(practice_graph.get_connections());
    // console.log(practice_graph.get_activities());
 
    // practice_graph.find_critical_path();
    // practice_graph.calculate_floats();
 
 
    // Test 3
    // var a = new Activity("A", 7)
    // var b = new Activity("B", 5)
    // var c = new Activity("C", 10)
    // var d = new Activity("D", 2)
    // var e = new Activity("E", 4)
    // var f = new Activity("F", 8)
    // var g = new Activity("G", 5)
    // var h = new Activity("H", 6)
    // var i = new Activity("I", 7)
    // var j = new Activity("J", 8)
    // var k = new Activity("K", 5)
    // var l = new Activity("L", 4)
 
    // d.add_preceding_activity(a);
    // e.add_preceding_activity(c);
    // f.add_preceding_activity(b);
    // f.add_preceding_activity(c);
    // f.add_preceding_activity(d);
    // g.add_preceding_activity(a);
    // h.add_preceding_activity(b);
    // h.add_preceding_activity(c);
    // h.add_preceding_activity(d);
    // i.add_preceding_activity(b);
    // i.add_preceding_activity(c);
    // i.add_preceding_activity(d);
    // i.add_preceding_activity(g);
    // j.add_preceding_activity(b);
    // j.add_preceding_activity(c);
    // j.add_preceding_activity(d);
    // j.add_preceding_activity(g);
    // l.add_preceding_activity(b);
    // l.add_preceding_activity(c);
    // l.add_preceding_activity(d);
    // l.add_preceding_activity(g);
    // k.add_preceding_activity(e);
    // k.add_preceding_activity(h);
 
    // var practice_graph = new CriticalGraph("trial");
    // practice_graph.add_activity(a);
    // practice_graph.add_activity(b);
    // practice_graph.add_activity(c);
    // practice_graph.add_activity(d);
    // practice_graph.add_activity(e);
    // practice_graph.add_activity(f);
    // practice_graph.add_activity(g);
    // practice_graph.add_activity(h);
    // practice_graph.add_activity(i);
    // practice_graph.add_activity(j);
    // practice_graph.add_activity(k);
    // practice_graph.add_activity(l);
 
    // practice_graph.build_activity_network();
 
    // console.log(practice_graph.get_nodes());
    // console.log(practice_graph.get_connections());
    // console.log(practice_graph.get_activities());
    // console.log(practice_graph.activity_coordinates_set);
 
    // practice_graph.find_critical_path();
    // practice_graph.calculate_floats();
 
    draw(practice_graph.get_nodes(), practice_graph.get_connections(), practice_graph.get_activities(), practice_graph.activity_floats);
 
}
 
 
// main();
 
 
// This deals with submissions from the actual page to make the page responsive and interactive
var id_counter = 1;
 
function add_element(){
 
    table = document.getElementById("precedence-table");
 
    canvas = document.createElement("tr");
 
    let activity_element = document.createElement("td");
    let precedence_element = document.createElement("td");
    let duration_element = document.createElement("td");
 
    activity_element.classList.add("title-element-left");
    precedence_element.classList.add("title-element-center");
    duration_element.classList.add("title-element-right");
 
    let activity_input = document.createElement("input");
    let precedence_input = document.createElement("input");
    let duration_input = document.createElement("input");
 
    activity_input.classList.add("Activity-inputs");
    precedence_input.classList.add("Activity-inputs");
    duration_input.classList.add("Activity-inputs");
 
    activity_input.id = "activity-"+JSON.stringify(id_counter);
    precedence_input.id = "precedence-"+JSON.stringify(id_counter);
    duration_input.id = "duration-"+JSON.stringify(id_counter);
    id_counter++;
 
    activity_input.classList.add("input-element");
    precedence_input.classList.add("input-element");
    duration_input.classList.add("input-element");
 
    activity_element.appendChild(activity_input);
    precedence_element.appendChild(precedence_input);
    duration_element.appendChild(duration_input);
 
    canvas.appendChild(activity_element);
    canvas.appendChild(precedence_element);
    canvas.appendChild(duration_element);
 
    table.appendChild(canvas);
}
 
function submission(){
    let activities = [];
    for(let i = 0; i < id_counter; i++){
        let activity_name = document.getElementById("activity-"+JSON.stringify(i)).value;
        let duration = parseInt(document.getElementById("duration-"+JSON.stringify(i)).value);
 
        var new_activity = new Activity(activity_name, duration);
        activities.push(new_activity);
    }
 
    for(let j = 0; j < id_counter; j++){
        let precedence_elements = document.getElementById("precedence-"+JSON.stringify(j)).value;
        let precedence = precedence_elements.split(",");
 
        for(let k = 0; k < precedence.length; k++){
            if(!(precedence[k] == "-")){
                proceding_name = precedence[k];
 
                for(let l = 0; l < activities.length; l++){
                    if(activities[l].activity_name == proceding_name){
                        activities[j].add_preceding_activity(activities[l]);
                    }
                }
            }
        }
    }
 
    var graph = new CriticalGraph("Critical Path Analysis");
    for(let i = 0; i < activities.length; i++){
        graph.add_activity(activities[i]);
    }
   
    graph.build_activity_network();
 
    console.log(graph.get_nodes());
    console.log(graph.get_connections());
    console.log(graph.get_activities());
    console.log(graph.activity_coordinates_set);
 
    graph.find_critical_path();
    graph.calculate_floats();
 
    draw(graph.get_nodes(), graph.get_connections(), graph.get_activities(), graph.activity_floats);
 
    for(let i = 0; i < activities.length; i++){
        let activity_element = document.getElementById("activity-"+JSON.stringify(i));
        let precedence_element = document.getElementById("precedence-"+JSON.stringify(i));
        let duration_element = document.getElementById("duration-"+JSON.stringify(i));
 
        activity_element.value = activities[i].activity_name;
        duration_element.value = JSON.stringify(activities[i].duration);
 
        var output = "";
        if(activities[i].proceded_by.length == 0){
            output = "-";
        } else {
            for(let j = 0; j < activities[i].proceded_by.length; j++){
                output = output + activities[i].proceded_by[j].activity_name + ",";
            }
        }
 
        precedence_element.value = output;
    }
 
}
