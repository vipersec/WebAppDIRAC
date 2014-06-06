/***
 * It is a predefined grid widget. It allows to easily create a Grid widget. You can provide the following values:
 *
 *
 *  -store: which is the data store object {@link Ext.dirac.utils.DiracJsonStore}.
 *
 *  -features: We can allow a list of futures: such as grouping etc.
 *
 *  -oClolumns: dictionary with the column names: {"a":{"dataIndex":"b"},"properties":{},renderFunction:"c"}
 *   There are different render functions provided by this widget. We can configure the grid panel to how render the data.
 *
 *    For example:
 *<pre>
 *      var oColumns = {
 *          "checkBox":{"dataIndex":"TransformationIDcheckBox"},
 *          "ID" : {"dataIndex":"TransformationID", "properties":{width:60, align:'left',hideable:false}},
 *          "Request" : {"dataIndex":"TransformationFamily","properties":{hidden:true}},
 *          "None" : {"dataIndex":"StatusIcon", "properties":{width:26,sortable:false, hideable:false,fixed:true,menuDisabled:true}, "renderFunction":"rendererStatus"},
 *          "Status":{"dataIndex":"Status","properties":{width:60}},
 *          "AgentType" :{"dataIndex":"AgentType","properties":{ width:60}},
 *          "Type":{"dataIndex":"Type"}}
 *  </pre>
 *  -tbar : it is a paging tool bar object. DIRAC provides the following widget: {@link Ext.dirac.utils.DiracPagingToolbar}.
 *
 *  -contextMenu: you can add a menu to the Grid. DIRAC provides the following menu: {@link Ext.dirac.utils.DiracApplicationContextMenu}.
 *
 *  -pagingToolbar: it keeps the paging tool bar.
 *
 *  -scope: it has to be provided, because the grid panel has to accessed to other widgets.
 *
 * For example:
 *
 *<pre>
 *    me.grid = Ext.create('Ext.dirac.utils.DiracGridPanel', {
 *        store : me.dataStore,
 *        features: [{ftype:'grouping'}],
 *        oColumns : oColumns,
 *        contextMenu : me.contextGridMenu,
 *        pagingToolbar : pagingToolbar,
 *        scope : me
 *      });
 *</pre>
 */
Ext.define('Ext.dirac.utils.DiracGridPanel', {
      extend : 'Ext.grid.Panel',
      mixins : ["Ext.dirac.core.Stateful"],
      region : 'center',
      height : '600',
      header : false,
      viewConfig : {
        stripeRows : true,
        enableTextSelection : true,
        listeners : {
          refresh : function(dataview) {
            var nodes = dataview.getNodes();
            for (var i = 0; i < nodes.length; i++) {
              row = Ext.fly(nodes[i], '_rowExpander');
              row.setHeight(26);
            }
          }
        }
      },
      /**
       * @property{Object} defaultColumnsProperties it contains the default
       *                   properties of the columns. The default value is
       *                   {sortable:true,align:'left',hidden:true}
       * 
       */
      defaultColumnsProperties : {
        sortable : true,
        align : 'left',
        hidden : true
      },
      /**
       * @cfg{List} columns it contains the grid columns
       */
      columns : [],
      /**
       * @cfg{List} renderers it contains a list of available renderer:
       *            ["rendererChkBox", "rendererStatus","diffValues"] NOTE: You
       *            can implement new renderer.
       */
      renderers : ["rendererChkBox", "rendererStatus", "diffValues"],
      /**
       * This function is used to load the data which is saved in the User
       * Profile.
       * 
       * @param{Object}data it contains the saved values.
       */
      loadState : function(data) {

        var me = this;
        var grid = null;
        if (data.columns) {//I have changed the data structure
          if ("columns" in data.columns) {
            grid = data.columns;
          } else {
            grid = data;
          }
        } else {
          grid = data.grid;
        }
        if (grid) {
          for (var i = 0; i < me.columns.length; i++) {

            var col = me.columns[i];
            if (Ext.Array.contains(grid.columns, col.getSortParam()) || (col.getSortParam() in grid.columns)) {
              col.setWidth(grid.columns[col.getSortParam()].width);
              if (grid.columns[col.getSortParam()].hidden)
                col.hide();
              else
                col.show();

              var sortState = grid.columns[col.getSortParam()].sortState;

              if (sortState != null)
                col.setSortState(sortState);
            }
          }
        }
        if (grid && grid.groupers) {
          me.store.groupers.clear();
          me.store.groupers.addAll(me.store.decodeGroupers(grid.groupers));
        }
        if (grid && grid.sorters) {
          me.store.sorters.clear();
          me.store.sorters.addAll(me.store.decodeSorters(grid.sorters));
        }

        me.pagingToolbar.loadState(data);

      },
      /*************************************************************************
       * It returns the available renderer.
       * 
       * @return{List}
       */
      getRenderers : function() {
        var me = this;
        return me.renderers;
      },
      /**
       * It returns the data which has to be saved in the User Profile.
       * 
       * @return{Object}
       */
      getStateData : function() {

        var me = this;

        // data for grid columns
        var oReturn = {
          columns : {}
        };

        for (var i = 0; i < me.columns.length; i++) {

          var col = me.columns[i];
          var oName = col.getSortParam();
          oReturn.columns[oName] = {
            "width" : col.width,
            "hidden" : col.isHidden(),
            "sortState" : col.sortState
          };

        }

        oReturn.sorters = [];
        oReturn.groupers = [];

        me.store.sorters.each(function(key, value) {
              GLOBAL.APP.CF.log('debug', ":", key);
              GLOBAL.APP.CF.log('debug', ":", value);
              oReturn.sorters.push({
                    "property" : key.property,
                    "direction" : key.direction
                  });
            });

        me.store.groupers.each(function(key, value) {
              GLOBAL.APP.CF.log('debug', ":", key);
              GLOBAL.APP.CF.log('debug', ":", value);
              oReturn.groupers.push({
                    "property" : key.property,
                    "direction" : key.direction
                  });
            });

        oReturn.pagingToolbar = me.pagingToolbar.getStateData();

        return oReturn;

      },
      initComponent : function(arguments) {
        var me = this;
        GLOBAL.APP.CF.log("debug", "init function", me.columns);
        me.callParent(arguments);
      },
      constructor : function(config) {
        var me = this;

        GLOBAL.APP.CF.log("debug", "Create panel...");
        me.checkboxFunctionDefinition = '<input type="checkbox" value="" onchange="';
        me.checkboxFunctionDefinition += 'var oChecked=this.checked;';
        me.checkboxFunctionDefinition += 'var oElems=Ext.query(\'#' + config.scope.id + ' input.checkrow\');';
        me.checkboxFunctionDefinition += 'for(var i=0;i<oElems.length;i++)oElems[i].checked = oChecked;';
        me.checkboxFunctionDefinition += '" class="dirac-table-main-check-box"/>';

        var oColumn = {};
        for (i in config.oColumns) {
          oColumn = {};
          if (i == "checkBox") {
            oColumn = {
              header : me.checkboxFunctionDefinition,
              name : "checkBox",
              width : 26,
              sortable : false,
              dataIndex : config.oColumns[i]["dataIndex"],
              renderer : function(value, metaData, record, row, col, store, gridView) {
                return me.rendererChkBox(value);
              },
              hideable : false,
              fixed : true,
              menuDisabled : true,
              align : "center"
            };
          } else {
            oColumn = {
              sortable : true,
              align : 'left',
              hidden : false
            };
            if (Ext.String.startsWith(i, "None") == true) {
              Ext.apply(oColumn, {
                    header : "",
                    dataIndex : config.oColumns[i]["dataIndex"]
                  });
            } else {
              Ext.apply(oColumn, {
                    header : i,
                    dataIndex : config.oColumns[i]["dataIndex"]
                  });
            }

            if ("properties" in config.oColumns[i]) {
              Ext.apply(oColumn, config.oColumns[i]["properties"]);
            }

            if ("renderFunction" in config.oColumns[i]) {
              var func = null;
              if (config.oColumns[i]["renderFunction"] == "rendererStatus") {
                func = function(value, metaData, record, rowIndex, colIndex, store) {
                  return me.rendererStatus(value, metaData, record, rowIndex, colIndex, store);
                };
              } else if (config.oColumns[i]["renderFunction"] == "diffValues") {
                func = function(value, metaData, record, rowIndex, colIndex, store) {
                  return me.diffValues(value, metaData, record, rowIndex, colIndex, store);
                };
              } else {
                var message = config.oColumns[i]["renderFunction"] + " render function does not exists!!!"
              }
              Ext.apply(oColumn, {
                    "renderer" : func
                  });
            }
            if ("renderer" in config.oColumns[i]) {
              Ext.apply(oColumn, {
                    "renderer" : config.oColumns[i]["renderer"]
                  });
            }
          }
          if (config.columns) {// Only when the oColumns are provided: we may
            // have a case when we need to provide all
            // columns.
            Ext.Array.push(config.columns, oColumn);
          } else {
            config.columns = [];
            Ext.Array.push(config.columns, oColumn);
          }

        }
        GLOBAL.APP.CF.log("debug", "Grid columns:", me.columns);
        if (config.contextMenu) {
          Ext.apply(me, {
                "listeners" : {

                  cellclick : function(oTable, td, cellIndex, record, tr, rowIndex, e, eOpts) {

                    if (cellIndex != 0) {
                      config.contextMenu.showAt(e.xy);
                    }

                  }
                }
              });
        }

        me.callParent(arguments);

        if (config.pagingToolbar) {
          me.pagingToolbar = config.pagingToolbar;
          me.addDocked(me.pagingToolbar, "top");
        }

      },
      /*************************************************************************
       * It render the Grid columns
       * 
       * @param{Number} val it is the column value
       */
      rendererChkBox : function(val) {
        return '<input value="' + val + '" type="checkbox" class="checkrow" style="margin:0px;padding:0px"/>';
      },
      /*************************************************************************
       * It render the Status
       * 
       * @param{String} value It render the status.
       */
      rendererStatus : function(value) {
        if ((value == 'Done') || (value == 'Good') || (value == 'Active') || (value == 'Cleared')) {
          return '<img src="static/core/img/statusIcons/done.gif"/>';
        } else if (value == 'Bad') {
          return '<img src="static/core/img/statusIcons/bad.gif"/>';
        } else if ((value == 'Failed') || (value == 'Bad') || (value == 'Banned') || (value == 'Aborted')) {
          return '<img src="static/core/img/statusIcons/failed.gif"/>';
        } else if ((value == 'Waiting') || (value == 'Stopped') || (value == 'Poor') || (value == 'Probing')) {
          return '<img src="static/core/img/statusIcons/waiting.gif"/>';
        } else if (value == 'Deleted') {
          return '<img src="static/core/img/statusIcons/deleted.gif"/>';
        } else if (value == 'Matched') {
          return '<img src="static/core/img/statusIcons/matched.gif"/>';
        } else if ((value == 'Running') || (value == 'Active') || (value == 'Fair')) {
          return '<img src="static/core/img/statusIcons/running.gif"/>';
        } else if (value == 'NoMask') {
          return '<img src="static/core/img/statusIcons/unknown.gif"/>';
        } else if ((value == 'Completed') || value == (value == 'Completing')) {
          return '<img src="static/core/img/statusIcons/completed.gif"/>';
        } else if (value == 'Idle') {
          return '<img src="static/core/img/statusIcons/idle.gif"/>';
        } else {
          return '<img src="static/core/img/statusIcons/unknown.gif"/>';
        }
      },
      /***
       * It render the columns in case we want to see the difference before load and after the load. More info {@link Ext.dirac.utils.DiracJsonStore}
       */
      diffValues : function(value, metaData, record, rowIndex, colIndex, store) {
        var me = this;
        var id = record.data.TransformationID;
        var diffValues = me.store.getDiffValues();
        if (diffValues) {
          if (id && diffValues[id]) {
            var field = metaData.column.dataIndex;
            try {
              var diff = value - diffValues[id][field];
              var test = diff + '';
              if (test.indexOf(".") > 0) {
                diff = diff.toFixed(1);
              }
              if (diff > 0) {
                return value + ' <font color="#00CC00">(+' + diff + ')</font>';
              } else if (diff < 0) {
                return value + ' <font color="#FF3300">(' + diff + ')</font>';
              } else {
                return value;
              }
            } catch (e) {
              return value;
            }
          } else {
            return value;
          }

        }
      }
    });