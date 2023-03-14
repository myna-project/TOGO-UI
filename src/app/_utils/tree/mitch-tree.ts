import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { ChartDialogComponent } from '../../_utils/chart-dialog/chart-dialog.component';

declare var d3: any;

@Injectable({
  providedIn: 'root',
})
export class MitchTreeGraph {

  constructor(private dialog: MatDialog, private router: Router) {}

  buildMitchTree(objs: any[], id: string, width: number, selectionValue: string, controllerView: boolean) {

    var router = this.router;
    var dialog = this.dialog;
    var isLandscape = width > 800 ? true : false;
    var orientation = selectionValue === 'vertical' ? '' : 'topToBottom';
    var isVertical = selectionValue === 'vertical' ? true : false;
    var marginBottom = isVertical ? 560 : 700;
    var marginLeft = isVertical ? 250 : 20;
    var editButtonX = isLandscape ? -9 : 29;
    var editButtonY = isLandscape ? 12 : 12;
    var editButtonWidth = isLandscape ? 15 : 30;
    var editButtonHeight = isLandscape ? 19 : 38;
    var showButtonX = isLandscape ? -9 : -9;
    var showButtonY = isLandscape ? -7 : -7;
    var showButtonWidth = isLandscape ? 15 : 30;
    var showButtonHeight = isLandscape ? 19 : 38;
    var measuresButtonX = isLandscape ? 110 : 110;
    var measuresButtonY = isLandscape ? 12 : 12;
    var measuresButtonWidth = isLandscape ? 15 : 30;
    var measuresButtonHeight = isLandscape ? 19 : 38;
    var horizontalSpacing = isLandscape ? 40 : 60;
    var verticalSpacing = isLandscape ? 25 : 50;
    var titleBoxPadding = { top: 1, right: 1, bottom: 1, left: 1 };

    var treePlugin = new d3.mitchTree.boxedTree()
      .setAllowZoom(false)
      .setAllowPan(true)
      .setAllowNodeCentering(false)
      .setMinScale(1)
      .setMaxScale(5)
      .setNodeDepthMultiplier(isVertical ? 200 : 150)
      .on("nodeClick", function (event: any) {
        this.removeSelection(this.getRoot());
        this.setAllowNodeCentering(false);
        event.nodeDataItem.selected = true;

        if (event.nodeDataItem._children != undefined) {
          this.centerNode(event.nodeDataItem);
          this.setAllowNodeCentering(true);
        }

        this.update();

        // Cancel the collapse event for tree root
        if (event.nodeDataItem.parent == null && event.type === 'collapse')
          event.continue = false;
      })
      .setAllowFocus(false)
      .setIsFlatData(true)
      .setData(objs)
      .setElement(document.getElementById(id))
      .setIdAccessor(function (objs: any) {
        return objs.id;
      })
      .setParentIdAccessor(function (objs: any) {
        if (controllerView)
          return objs.controller_id;
        else
          return objs.parent_id;
      })
      .setBodyDisplayTextAccessor(function (_objs: any) {})
      .setTitleDisplayTextAccessor(function (objs: any) {
        return objs.name;
      })
      .setOrientation(orientation)
      .setMargins({ top: 20, right: 100, bottom: marginBottom, left: marginLeft })
      .getNodeSettings()
        .setSizingMode('nodesize')
        .setVerticalSpacing(verticalSpacing)
        .setHorizontalSpacing(horizontalSpacing)
        .setBodyBoxWidth(120)
        .setBodyBoxHeight(55)
        .setTitleBoxWidth(80)
        .setTitleBoxHeight(35)
        .setTitleBoxPadding(titleBoxPadding)
        .back()
      .initialize();

    function updateTreeClasses(treePlugin: any) {

      treePlugin.getPanningContainer().selectAll("g.node")
        .append("image")
        .attr('x', 65)
        .attr('y', -25)
        .attr('width', 50)
        .attr('height', 50)
        .attr('xlink:href', function(d: any) {
          var obj = objs.find(current => current.id === +d.id);
          return obj.image ? 'data:image/jpeg;base64,' + obj.image : undefined;
        })
        .style("cursor", function(d: any) {
          return (d.id > -1) ? 'pointer' : 'default';
        });

      treePlugin.getPanningContainer().selectAll("g.node")
        .append("svg:image")
        .attr('x', showButtonX)
        .attr('y', showButtonY)
        .attr('width', showButtonWidth)
        .attr('height', showButtonHeight)
        .attr("xlink:href", "assets/img/drains.png")
        .on('click', function(d: any) {
          router.navigate([router.url.slice(0, -1) + '/' + +d.id + '/drains']);
        })
        .style("cursor", function(d: any) {
          return (d.id > -1) ? 'pointer' : 'default';
        })
        .style("visibility", function(d: any) {
          return (d.id > -1) ? 'visible' : 'hidden';
        });

      treePlugin.getPanningContainer().selectAll("g.node")
        .append("svg:image")
        .attr('x', editButtonX)
        .attr('y', editButtonY)
        .attr('width', editButtonWidth)
        .attr('height', editButtonHeight)
        .attr("xlink:href", "assets/img/edit.png")
        .on('click', function(d: any) {
          router.navigate([router.url.slice(0, -1) + '/' + +d.id]);
        })
        .style("cursor", function(d: any) {
          return (d.id > -1) ? 'pointer' : 'default';
        })
        .style("visibility", function(d: any) {
          return (d.id > -1) ? 'visible' : 'hidden';
        });

      treePlugin.getPanningContainer().selectAll("g.node")
        .append("svg:image")
        .attr('x', measuresButtonX)
        .attr('y', measuresButtonY)
        .attr('width', measuresButtonWidth)
        .attr('height', measuresButtonHeight)
        .attr("xlink:href", "assets/img/measures.png")
        .on('click', function(d: any) {
          var obj = objs.find(current => current.id === +d.id);
          if (((obj.default_drain_ids !== undefined) && (obj.default_drain_ids !== null) && (obj.default_drain_ids.length > 0)) || ((obj.formula_ids !== undefined) && (obj.formula_ids !== null) && (obj.formula_ids.length > 0)))
            dialog.open(ChartDialogComponent, { width: '75%', data: { drains: obj.default_drain_ids, formulas: obj.formula_ids } });
        })
        .style("cursor", function(d: any) {
          var obj = objs.find(current => current.id === +d.id);
          return (((obj.default_drain_ids !== undefined) && (obj.default_drain_ids !== null) && (obj.default_drain_ids.length > 0)) || ((obj.formula_ids !== undefined) && (obj.formula_ids !== null) && (obj.formula_ids.length > 0))) ? 'pointer' : 'default';
        })
        .style("visibility", function(d: any) {
          var obj = objs.find(current => current.id === +d.id);
          return (((obj.default_drain_ids !== undefined) && (obj.default_drain_ids !== null) && (obj.default_drain_ids.length > 0)) || ((obj.formula_ids !== undefined) && (obj.formula_ids !== null) && (obj.formula_ids.length > 0))) ? 'visible' : 'hidden';
        });

      treePlugin.getPanningContainer().selectAll("g.node")
        .attr("class", function(data: any) {
          var existingClasses = this.getAttribute('class');
          var obj = objs.find(current => current.id === +data.id);
          if (!obj.hasOwnProperty('feed_ids')) {
            var emptyClass = "empty-client";
            if ((' ' + existingClasses + ' ').indexOf(' ' + emptyClass + ' ') === -1)
              existingClasses += " " + emptyClass;
          } else {
            if (!obj.hasOwnProperty('active') || !obj.active) {
              var inactiveClass = "inactive-client";
              if ((' ' + existingClasses + ' ').indexOf(' ' + inactiveClass + ' ') === -1)
                existingClasses += " " + inactiveClass;
            }
          }
          if ((obj.hasOwnProperty('alert') && obj.alert) || (obj.hasOwnProperty('alarm') && obj.alarm)) {
            var alertClass = "alert";
            if ((' ' + existingClasses + ' ').indexOf(' ' + alertClass + ' ') === -1)
              existingClasses += " " + alertClass;
          } else if (obj.hasOwnProperty('warning') && obj.warning) {
            var warningClass = "warning";
            if ((' ' + existingClasses + ' ').indexOf(' ' + warningClass + ' ') === -1)
              existingClasses += " " + warningClass;
          }
          return existingClasses;
        });
    }

    treePlugin.update = function(nodeDataItem: any){
      this.__proto__.update.call(this, nodeDataItem);
      updateTreeClasses(this);
    }

    updateTreeClasses(treePlugin);
  }
}
