import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';
import { DAG, SNode, GraphService, CategoryList, FilterCriteria } from '../graph.service';
import { DialogsService } from './../dialogs.service';
import { GraphTab } from "../GraphTab";
import { GraphFilter } from "../GraphFilter";
import { Searchable } from "../Searchable";
import { FullDocNode, Note } from '../standard-map';
import { DomSanitizer } from '@angular/platform-browser';
import { debounce } from 'rxjs/operators';
import * as Rx from 'rxjs';

import { TreeModel, TreeNode, ITreeState } from 'angular-tree-component';
  

import selection_attrs from 'd3-selection-multi/src/selection/attrs';
d3.selection.prototype.attrs = selection_attrs;

class TableData
{
    constructor(
      public headers: string[],
      public rows: SNode[][]) {
    }
}
 


@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: [ './graph.component.css' ],
  encapsulation: ViewEncapsulation.None // Allow D3 to read styles through shadow DOM
})
export class GraphComponent implements OnInit, OnDestroy {    
    public graphType: number = 0;
    public graphData: DAG;
    public graphCategories: CategoryList = [];
    public graphCriteria = new FilterCriteria();
    public tableData: TableData = null;
    
    public complianceColors = ["white", "green", "yellow", "red", "black"];
    public svgbgElement: any;
    private searchable: Searchable;

    public hideFilter: boolean = false;
  
    private graphColorScale = d3.scaleOrdinal().range(d3.schemeSet3);

    constructor(
      public graphService: GraphService,
      public dialogService: DialogsService,
      private sanitizer: DomSanitizer) {
        
        this.graphService.updateSubject.pipe(debounce(() => Rx.timer(1))).subscribe({
          next: (v) => this.updateGraph()
        });
        this.graphService.updateViewSubject.pipe(debounce(() => Rx.timer(1))).subscribe({
          next: (v) => this.updateGraphView()
        });

        this.searchable = new Searchable();
    };

    ngOnInit(): void {     
      this.graphService.getDocTypes()
        .subscribe(dt => { 
          this.graphCategories = dt; 
        });
    }

    ngOnDestroy(): void {
    }

    public getMenuOptions(): any[] {
        var result = [];

        if (this.graphService.canAdd)
        {
            for (var t of this.graphCategories)
                if (!this.graphService.graphTabs.find(g => g.id == t.id))
                    result.push(t);
        }

        return result;
    }

    //private DrawTable(data: DAG) {
    //    var rowType = this.graphCriteria.categoryOrder ? this.graphCriteria.categoryOrder[0] : (data.nodes[0] as SNode).data.type;
    //    var headerTypes = this.graphCriteria.categoryOrder.filter(v => v != rowType);

    //    var headerNodes = [rowType].concat(headerTypes);
    //    var rowNodes = data.nodes.filter(v => v.data.type == rowType).map(d => {
    //            var links = headerTypes.map(h => {
    //              for (var l of data.links)
    //              {
    //                 var node = null;

    //                 if (l.source == d.nodeId && l.targetNode.data.type == h)
    //                    node = l.targetNode;

    //                 if (l.target == d.nodeId && l.sourceNode.data.type == h)
    //                    node = l.sourceNode;

    //                 if (node)
    //                    return node;
    //              }

    //              return null;
    //            });

    //            return [d].concat(links);
    //        });

    //    var width = 960;
    //    var height = 500;

    //    // clear
    //    d3.selectAll("#d3").selectAll("*").remove();

    //    this.tableData = new TableData(headerNodes, rowNodes);
    //}

    //private DrawChart(energy: DAG) {
    //    var width = 960;
    //    var height = 500;

    //    // clear
    //    d3.selectAll("#d3").selectAll("*").remove();
    //    this.tableData = null;

    //    var svg = d3.selectAll("#d3").append("svg");
    //        svg.attr("width", width);
    //        svg.attr("height", height);

    //    var formatNumber = d3.format(",.0f"),
    //        format = function (d: any) { return formatNumber(d) + " TWh"; },
    //        color = d3.scaleOrdinal(d3.schemeCategory10);

    //    var sankey = d3Sankey.sankey()
    //        .nodeWidth(15)
    //        .nodePadding(10)
    //        .extent([[1, 1], [width - 1, height - 6]]);

    //    var link = svg.append("g")
    //        .attr("class", "links")
    //        .attr("fill", "none")
    //        .attr("stroke", "#000")
    //        .attr("stroke-opacity", 0.2)
    //        .selectAll("path");

    //    var node = svg.append("g")
    //        .attr("class", "nodes")
    //        .attr("font-family", "sans-serif")
    //        .attr("font-size", 10)
    //        .selectAll("g");

    //        sankey.nodeAlign(d3Sankey.sankeyLeft);
    //        //sankey.nodeAlign((n, d) => {
    //        //  return this.graphCriteria.categoryOrder.indexOf(n.data.type);
    //        //});
    //        sankey.nodeSort((a: SNode, b: SNode) => a.name < b.name ? -1 : 1);
    //        sankey.nodeId((d: SNode) => d.nodeId);
    //        sankey.nodeWidth(250);

    //        sankey(energy);

    //        link = link
    //            .data(energy.links);

    //        link.enter().append("path")
    //            .attr("d", d3Sankey.sankeyLinkHorizontal())
    //            .attr("stroke-width", function (d: any) { return 10; }) //Math.max(1, d.width) * 0.; })
    //            .attr("stroke", d => "black") //color(d.source.name))
    //            .on('click', function(d, i) {
    //              console.log("clicked link", d);
    //            })
    //            .on("mouseover", function(d) {
    //                d3.select(this).style("cursor", "pointer"); 
    //              });

    //        link.append("title")
    //            .text(function (d: any) { return d.source.name + " → " + d.target.name + "\n" + format(d.value) + "\n" + d.uom; });

    //        node = node
    //            .data(energy.nodes)
    //            .enter().append("g");

    //        node.append("rect")
    //            .attr("x", function (d: any) { return d.x0; })
    //            .attr("y", function (d: any) { return d.y0; })
    //            .attr("height", function (d: any) { return d.y1 - d.y0; })
    //            .attr("width", function (d: any) { return d.x1 - d.x0; })
    //            .attr("fill", d => { return this.complianceColors[energy.nodes[d.index].data.compliance_level]; } ) //color(d.name.replace(/ .*/, "")); })
    //            .attr("stroke", "#000")
    //            .on('click', function(d, i) {
    //              console.log("clicked node", d);
    //            })
    //            .on("mouseover", function(d) {
    //                d3.select(this).style("cursor", "pointer"); 
    //              });

    //        node.append("text")
    //            .attr("x", function (d: any) { return d.x0 + 6; }) //{ return d.x0 - 6; })
    //            .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
    //            .attr("dy", "0.35em")
    //            .attr("text-anchor", "start")
    //            .text(function (d: any) { return d.name + "\n" + d.data.getBody(); });
    //            //.filter(function (d: any) { return d.x0 < width / 2; })
    //            //.attr("x", function (d: any) { return d.x1 + 6; })
    //            //.attr("text-anchor", "start");

    //        node.append("title")
    //            .text(function (d: any) { return d.name + "\n" + d.data.getBody(); });
    //}

    //private DrawGraph(data: DAG) {
    //    var width = 960;
    //    var height = 500;

    //    // clear
    //    d3.selectAll("#d3").selectAll("*").remove();
    //    this.tableData = null;

    //    var svg = d3.selectAll("#d3").append("svg");
    //        svg.attr("width", width);
    //        svg.attr("height", height);

    //    var link, node, edgelabels, edgepaths;
            
    //    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    //    svg.append('defs').append('marker')
    //        .attrs({'id':'arrowhead',
    //            'viewBox':'-0 -5 10 10',
    //            'refX':13,
    //            'refY':0,
    //            'orient':'auto',
    //            'markerWidth':13,
    //            'markerHeight':13,
    //            'xoverflow':'visible'})
    //        .append('svg:path')
    //        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    //        .attr('fill', '#999')
    //        .style('stroke','none');

    //    var simulation = d3.forceSimulation()
    //        .force("link", d3.forceLink().id(function (d) {return d.nodeId;}).distance(100).strength(1))
    //        .force("charge", d3.forceManyBody())
    //        .force("center", d3.forceCenter(width / 2, height / 2));

    //    update(data.links, data.nodes);

    //    function update(links, nodes) {
    //        link = svg.selectAll(".link")
    //            .data(links)
    //            .enter()
    //            .append("line")
    //            .attr("class", "link")
    //            .attr('marker-end','url(#arrowhead)');

    //        link.append("title")
    //            .text(function (d) {return ""; }); //d.type;});

    //        edgepaths = svg.selectAll(".edgepath")
    //            .data(links)
    //            .enter()
    //            .append('path')
    //            .attrs({
    //                'class': 'edgepath',
    //                'fill-opacity': 0,
    //                'stroke-opacity': 0,
    //                'id': function (d, i) {return 'edgepath' + i}
    //            })
    //            .style("pointer-events", "none");

    //        edgelabels = svg.selectAll(".edgelabel")
    //            .data(links)
    //            .enter()
    //            .append('text')
    //            .style("pointer-events", "none")
    //            .attrs({
    //                'class': 'edgelabel',
    //                'id': function (d, i) {return 'edgelabel' + i},
    //                'font-size': 10,
    //                'fill': '#aaa'
    //            });

    //        edgelabels.append('textPath')
    //            .attr('xlink:href', function (d, i) {return '#edgepath' + i})
    //            .style("text-anchor", "middle")
    //            .style("pointer-events", "none")
    //            .attr("startOffset", "50%")
    //            .text(function (d) {return ""; });

    //        node = svg.selectAll(".node")
    //            .data(nodes)
    //            .enter()
    //            .append("g")
    //            .attr("class", "node")
    //            .call(d3.drag()
    //                    .on("start", dragstarted)
    //                    .on("drag", dragged)
    //                    //.on("end", dragended)
    //            );

    //        node.append("circle")
    //            .attr("r", 5)
    //            .style("fill", function (d, i) {return colors(i);})

    //        node.append("title")
    //            .text(function (d) {return d.nodeId;});

    //        node.append("text")
    //            .attr("dy", -3)
    //            .text(function (d) {return d.name;});

    //        simulation
    //            .nodes(nodes)
    //            .on("tick", ticked);

    //        simulation.force("link")
    //            .links(links);
    //    }

    //  function ticked() {
    //      link
    //          .attr("x1", function (d) {return d.source.x;})
    //          .attr("y1", function (d) {return d.source.y;})
    //          .attr("x2", function (d) {return d.target.x;})
    //          .attr("y2", function (d) {return d.target.y;});

    //      node
    //          .attr("transform", function (d) {return "translate(" + d.x + ", " + d.y + ")";});

    //      edgepaths.attr('d', function (d) {
    //          return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
    //      });

    //      edgelabels.attr('transform', function (d) {
    //          if (d.target.x < d.source.x) {
    //              var bbox = this.getBBox();

    //              var rx = bbox.x + bbox.width / 2;
    //              var ry = bbox.y + bbox.height / 2;
    //              return 'rotate(180 ' + rx + ' ' + ry + ')';
    //          }
    //          else {
    //              return 'rotate(0)';
    //          }
    //      });
    //  }

    //  function dragstarted(d) {
    //      if (!d3.event.active) simulation.alphaTarget(0.3).restart()
    //      d.fx = d.x;
    //      d.fy = d.y;
    //  }

    //  function dragged(d) {
    //      d.fx = d3.event.x;
    //      d.fy = d3.event.y;
    //  }
    //}

    public tabChanged() {
        this.graphService.tabChanged();
    }

    public activateNode(tab: GraphTab, event: any) {
        if (tab.column.treeModel) {
            var newSelection = {};
            newSelection[tab.column.state.focusedNodeId] = true; // single select
            tab.column.state.activeNodeIds = newSelection; 
            
            this.graphService.updateSubject.next(0);
        }
    }

    public onResize(event) {
        //event.target.innerWidth;
        this.graphService.updateViewSubject.next(0);
    }

    private buildLinkSet(fromTab: GraphTab, toTab: GraphTab, rtl: boolean): void {
        
        // For all the links that are not filtered already
        var links = fromTab.visibleLinks;

        // make a hash table from source _root_ node id, to list of links. 
        //  The source _root_ node is the first node in the ascenstery that is visible (parent is not collpased)
        var rollup = links.reduce((a, b) => {
            var owner = b.fromNode;

            // Iterate to root, keep track of highest collapsed node.
            var iterator = owner;
            while (iterator.realParent)
            {
              iterator = iterator.realParent;
              if (iterator.isCollapsed)
                owner = iterator;
            }

            // Create the list if it doesnt exist
            if (!(owner.id in a))
                a[owner.id] = [];

            // add the link
            a[owner.id].push(b);
            return a;
        }, { });

        var destinationHits = { };
        var fromTree = fromTab.treeModel;
        var toTree = toTab.treeModel;

        // for each source root node, aggregate links to destination root nodes
        //  destination _root_ nodes are the first node in the ascenstery that is visible (parent is not collpased)
        var rollup2 = Object.keys(rollup).map(k => {
            var collapsed = rollup[k].reduce((a, b) => {
                var link = b.link;
				        var owner = toTree.getNodeById(link.id);
				        if (!owner) {
					        toTab.parent.errors["- node not found: " + link.id + ", Referenced from: " + b.fromNode.id] = true;
					        return a;
				        }

                // Iterate to root, keep track of highest collapsed node.
                var iterator = owner;
                while (iterator.realParent)
                {
                  iterator = iterator.realParent;
                  if (iterator.isCollapsed)
                    owner = iterator;
                }
                
                // Create the list if it doesnt exist
                if (!(owner.id in a))
                    a[owner.id] = [];

                // add the link
                a[owner.id].push(link);
                
                // Create the list if it doesnt exist
                if (!(owner.id in destinationHits))
                    destinationHits[owner.id] = {};

                // add the link
                var hitsMap = destinationHits[owner.id];
                if (!(k in hitsMap))
                  hitsMap[k] = { k: k, top: fromTree.getNodeById(k).elementRef2.getBoundingClientRect().top };

                return a;
            }, { });

            return [k, collapsed];
        });

        for (var h in destinationHits) {
          var list = destinationHits[h];
          destinationHits[h] = Object.keys(list).map(v => list[v]).sort((a, b) => a.top - b.top);
        }


        // Create one aggregated list of links with all the necessary parameters for the view
        // start with the links map from source root node, to destination root nodes 
        var flatten = rollup2.reduce((a, b) => {
            var destinationMap = b[1];
            var fromKey = b[0];
            var fromNode: TreeNode = fromTree.getNodeById(fromKey);

            // If the source node is hidden, continue.
            if (fromNode.id in fromTree.hiddenNodeIds)
              return a;

            var srcNodes = Object.keys(destinationMap).map(v => {
              var node = toTree.getNodeById(v);
              var bounds = (node&&node.elementRef2) ? node.elementRef2.getBoundingClientRect().top : 0;
              return { key: v, node: node, y: bounds };
            });

            //srcNodes.sort((a, b) => a.y - b.y);
            var srcScale = 1/srcNodes.length;
            var srcIndex = 0;


            // one source node may map to many destination.
            for (var destinationNode of srcNodes)
            {
              var toNode = destinationNode.node; 
              var destinationKey = destinationNode.key;
              
              if (!(toNode.id in toTree.hiddenNodeIds))
              {
                var dstHitKeys = destinationHits[destinationKey];
                //var destinationData = destinationMap[destinationKey];
                
                //var dstHitKeys = Object.keys(destinationHit);
                var dstScale = 1/dstHitKeys.length;
                var dstIndex = dstHitKeys.findIndex(v => v.k == fromKey);

                // store a refrence to the connections in the source node.
                fromNode.data.connectedTo[destinationKey] = true;
                a.push({
                    from: fromKey,
                    fromNode: fromNode,
                    to: destinationKey,
                    toNode: toNode,
                    fromTree: fromTree,
                    toTree: toTree,
                    rtl: rtl,
                    scale: rtl ? -1 : 1,
                    weight: (fromNode.isActive || toNode.isActive) ? 2 : 1,
                    x1: 0,
                    x2: 0,
                    x3: 0,
                    x4: 0,
                    y1: 0,
                    y2: 0,
                    d: "",
                    color: "#000",
                    srcScale: srcScale,
                    srcIndex: srcIndex++,
                    dstScale: dstScale,
                    dstIndex: dstIndex
                });
              }
            }
            return a;
        }, []);

        fromTab.displayLinks = flatten;
    }

    public updateGraph() {
        var tabs = this.graphService.graphTabs;

        // delay the rendering so dom can settle.
        //setTimeout(a => {
            var isoTab = tabs.find(t => t.isIso);
            var isoIndex = tabs.indexOf(isoTab);

            for (var t = 0; t < tabs.length; ++t)
            {
                var tab = tabs[t];
                if (tab != isoTab)
                  this.buildLinkSet(tab.column, isoTab.column, t > isoIndex);
            }
            
            this.graphService.updateViewSubject.next(0);
        //}, 1);
    }

    public updateGraphView() {
        if (!this.svgbgElement)
            return;

        var tabs = this.graphService.graphTabs;        
        var startingGapLeft = 0;
        var startingGapRight = 0;
        var arrowLength = 0;
        var svgBounds = this.svgbgElement.getBoundingClientRect();
        var colorIndex = 0;

        if (!this.graphService.visualStyle) {
          // legacy style
          startingGapRight = 10;
          arrowLength = 10;
        }
      
        for (var tab of tabs)
        {
          for (var l of tab.column.displayLinks)
          {
            var fromBounds = l.fromNode.elementRef2.getBoundingClientRect();
            var toBounds = l.toNode.elementRef2.getBoundingClientRect();

            l.x1 = (l.rtl ? (fromBounds.left - startingGapRight) : (fromBounds.right + startingGapLeft)) - svgBounds.left;
            l.x2 = (l.rtl ? (toBounds.right + arrowLength) : (toBounds.left - arrowLength)) - svgBounds.left;
            l.y1 = fromBounds.top - svgBounds.top + fromBounds.height * 0.5;
            l.y2 = toBounds.top - svgBounds.top + toBounds.height * 0.5;
            
            // Locations for the arrow head
            l.x3 = l.x2 - 2 * l.scale;
            l.x4 = l.x2 + 0.1 * l.scale;

            // bezier based path
            var p1yDiff = fromBounds.height *  l.srcScale;
            var p2yDiff = toBounds.height * l.dstScale;
            var horzSpan = l.x2 - l.x1;
            var controlLength = horzSpan * 0.5;
            var p1x = l.x1;
            var p1y = fromBounds.top - svgBounds.top + fromBounds.height * l.srcScale * l.srcIndex;
            var c1x = p1x + controlLength;
            var c1y = p1y;
            var p2x = l.x2;
            var p2y = toBounds.top - svgBounds.top + toBounds.height * l.dstScale * l.dstIndex
            var c2x = p2x - controlLength;
            var c2y = p2y;

            l.color = this.graphColorScale(colorIndex++);
            l.d = `M ${p1x},${p1y} ` // Move to start
                + `C ${ c1x },${ c1y }, ${ c2x },${ c2y }, ${ p2x },${ p2y } ` // Bezier the top edge
                + `L ${ p2x },${ p2y + p2yDiff } `  // Line to the thickness
                + `C ${ c2x },${ c2y + p2yDiff }, ${ c1x },${ c1y + p1yDiff }, ${ p1x },${ p1y + p1yDiff }`; // Bezier back the bottom edge
          }
        }
    }

    public setup(data, treeElement) {
        data.treeModel = treeElement.treeModel;
        treeElement.viewportComponent.elementRef.nativeElement.addEventListener('scroll', t => this.updateGraphView()); 
    }

    public clickedLink(link: any) {
        link.fromTree.getNodeById(link.from).expandAll();
        link.toTree.getNodeById(link.to).expandAll();
    }

    public bindTogether(node, element, svgbg, checkBox, tab: GraphTab) {
      node.elementRef2 = element;
      this.svgbgElement = svgbg;
      if (checkBox)
        tab.inputObjectsMap[checkBox.id] = checkBox;
    }

    public openTab(url: string)
    {
        window.open(url, "_blank").focus();
    }
  
    public filterMapped(tab: GraphTab)
    {
        tab.filterMapped();
        this.graphService.activateTab(tab);
    }

    public filterIsoCoverage(tab: GraphTab)
    {
        var isoTab = this.graphService.graphTabs[1];
        isoTab.filterToIds(tab.coverage.uncoveredIds);
        this.graphService.activateTab(isoTab);
    }

    private onKeyDown(tab: GraphTab, node: TreeNode, event: any) {
      switch (event.code)
      {
        case "Digit1":
          {
            if (event.shiftKey)
              this.toggleTree(0, tab);
          }
          break;
        case "Digit2":
          {
            if (event.shiftKey)
              this.toggleTree(1, tab);
          }
          break;
        case "Digit3":
          {
            if (event.shiftKey)
              this.toggleTree(2, tab);
          }
          break;
        case "ArrowRight":
          {
            if (event.shiftKey)
              this.nextTree(node, tab, event);
            else
              GraphComponent.descendTree(node, tab, event);
            event.preventDefault();
            event.stopPropagation();
          }
          break;
        case "ArrowLeft": 
          {
            if (event.shiftKey)
              this.prevTree(node, tab, event);
            else
              GraphComponent.ascendTree(node, tab, event);
            event.preventDefault();
            event.stopPropagation();
          }
          break;
        case "ArrowDown": GraphComponent.moveFocusUpDown(tab, node, 1); break;
        case "ArrowUp": GraphComponent.moveFocusUpDown(tab, node, -1); break;
        case "Home":
          {
            var root = node.treeModel.getVisibleRoots()[0];
            if (root) {
              GraphComponent.selectInputById(tab, root.id);
              event.preventDefault(); 
            }
          }
          break;
      }
    }

    private nextTree(node: TreeNode, tab: GraphTab, event: any) {
      if (!tab.parent) {
        //we're in filter tab
        this.activateTree(0, true);
      }
      else {
        var currentIndex = this.graphService.graphTabs.indexOf(tab.parent);
        if (currentIndex < this.graphService.graphTabs.length - 1) {
          this.activateTree(currentIndex + 1, true);
        }
      }
    }

    private prevTree(node: TreeNode, tab: GraphTab, event: any) {
      if (!tab.parent) {
        //we're in filter tab
        // no prev tree
      }
      else {
        var currentIndex = this.graphService.graphTabs.indexOf(tab.parent);
        if (currentIndex > 0) {
          this.activateTree(currentIndex - 1, true);
        }
        else {
          this.activateTree(this.graphService.selectedTab, false);
        }
      }
    }

    private activateTree(index: number, graph: boolean) {
        var tab = this.graphService.graphTabs[index];
        var finalize = Promise.resolve(true);
        if (graph)
          tab = tab.column;
        else if (this.graphService.selectedTab != index)
          finalize = this.graphService.activateTab(tab);
        
        finalize.then(v => {
          var nextId = tab.treeModel.getVisibleRoots()[0].id
          GraphComponent.selectInputById(tab, nextId);
        });
    }

    private toggleTree(index: number, tab: GraphTab) {
      if (index > this.graphService.graphTabs.length - 1)
        return; // invalid index

      if (!tab.parent) {
        //we're in filter tab
        if (index != this.graphService.selectedTab)
          this.activateTree(index, false); // jump to this tab in filter
        else
          this.activateTree(index, true); // jump to this tab in graph
      }
      else {
        //we're in graph tab
        var currentIndex = this.graphService.graphTabs.indexOf(tab.parent);
        if (index != currentIndex)
          this.activateTree(index, true); // jump to this tab in graph
        else
          this.activateTree(index, false); // jump to this tab in filter
      }
    }

    static ascendTree(node: TreeNode, tab: GraphTab, event: any) {
        if (node.parent) {
            // dont let them keyboard expand if we have a tab.parent, ie we are in the graph.
            //  expand is disabled in that view
            if (!tab.parent)
                node.collapse();
            GraphComponent.selectInputById(tab, node.parent.id);
        }
    }

    static descendTree(node: TreeNode, tab: GraphTab, event: any) {
        if (node.visibleChildren.length > 0) {
            // dont let them keyboard expand if we have a tab.parent, ie we are in the graph.
            //  expand is disabled in that view
            if (!tab.parent)
                node.expand();
            if (node.isExpanded) {
                GraphComponent.selectInputById(tab, node.visibleChildren[0].id);
            }
        }
    }

    static moveFocusUpDown(tab: GraphTab, node: TreeNode, amount: number) {
        var index = node.parent.visibleChildren.findIndex(f => f.id == node.id);
        if (index > -1) {
            var newIndex = index + amount;
            var nextItem = node.parent.visibleChildren[newIndex];
            if (nextItem) {
              GraphComponent.selectInputById(tab, nextItem.id);
            }
        }
    }

    static selectInputById(tab: GraphTab, nextId: any) {
        var selectedObject = tab.inputObjectsMap[tab.id + '.cb.' + nextId];
        if (selectedObject)
          selectedObject.focus();
    }

    public toggleShowFilter() {
        this.hideFilter = !this.hideFilter;
    }

    public onSliderChange(event) {
        // Update the value in real time
        this.graphService.visualZoom = event.value;
        this.graphService.updateViewSubject.next(0);
    }

    public onStyleChange(event) {
        this.graphService.updateViewSubject.next(0);
    }
}
