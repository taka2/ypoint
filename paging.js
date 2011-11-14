Ext.Loader.setConfig({enabled: true});

Ext.require([
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.toolbar.Paging',
    'Ext.ModelManager',
    'Ext.tip.QuickTipManager'
]);

Ext.onReady(function(){
    Ext.tip.QuickTipManager.init();

    Ext.define('YahooShoppingItems', {
        extend: 'Ext.data.Model',
        fields: ["name", "url", "price", "image"],
    });

    Ext.define('MyReader', {
      extend : 'Ext.data.reader.Json',
      alias: 'reader.MyReader',
      read: function(response) {
        var data = [];
        var resultSet = response["ResultSet"];
        var totalResultsAvailable = resultSet.totalResultsAvailable;
        var totalResultsReturned = resultSet.totalResultsReturned;

        // MAX1,000件まで
        if(totalResultsAvailable > 1000) {
          totalResultsAvailable = 1000;
        }

        for(var i=0; i<totalResultsReturned; i++) {
          var result = resultSet["0"]["Result"][i];
          var name = result.Name;
          var url = result.Url;
          var price = result.Price._value;
          var image = result.Image.Small;
          data.push({name: name, url: url, price: price, image: image});
        }

        return Ext.create('Ext.data.ResultSet', {
            total  : totalResultsAvailable,
            count  : totalResultsReturned,
            records: this.extractData(data),
            success: true,
            message: ''
        });
      }
    });

    // create the Data Store
    var store = Ext.create('Ext.data.Store', {
        pageSize: 20,
        model: 'YahooShoppingItems',
        proxy: {
            type: 'jsonp',
            url: 'http://shopping.yahooapis.jp/ShoppingWebService/V1/json/itemSearch', 
            reader: {type: 'MyReader'},
            extraParams: {
              appid: 'uzgKFgmxg65Fhp4k02wS.L5LpfsMPmK2mCZD.babhFv4yh51QoLoJekoNeHayeIP'
              , category_id: '1'
              , price_from: 1
              , price_to: 1
              , sort: '-price'
              , availability: 1
              , shipping: 1
              , affiliate_type: 'yid'
              , affiliate_id: 'B6GbzFBZxtf6U9yv.Mmq0Q--'
            },
            limitParam: 'hits',
            startParam: 'offset'
        }
    });

    function renderImage(value, p, record) {
        return Ext.String.format(
            '<img src = "{0}" alt = "{1}">',
            record.data.image,
            record.data.name
        );
    }

    function renderName(value, p, record) {
        return Ext.String.format(
            '<b><a href="{1}" target="_blank">{0}</a></b>',
            record.data.name,
            record.data.url
        );
    }

    function renderPrice(value, p, record) {
        return Ext.String.format(
            '{0}円',
            record.data.price
        );
    }

    var pluginExpanded = true;
    var grid = Ext.create('Ext.grid.Panel', {
        width: 800,
        height: 500,
        title: '検索結果',
        store: store,
        disableSelection: true,
        loadMask: true,
        viewConfig: {
            id: 'gv',
            trackOver: false,
            stripeRows: false
        },
        // grid columns
        columns:[{
            id: 'name',
            text: "商品名",
            dataIndex: 'name',
            flex: 1,
            renderer: renderName,
            sortable: false
        },{
            id: 'price',
            text: "価格",
            dataIndex: 'price',
            renderer: renderPrice,
            sortable: true
        }],
        // paging bar on the bottom
        bbar: Ext.create('Ext.PagingToolbar', {
            store: store,
            displayInfo: true,
            displayMsg: '全{2}件中 {0}～{1}件目',
            emptyMsg: "検索結果がありません。"
        }),
        renderTo: 'topic-grid'
    });

    var simple = Ext.create('Ext.form.Panel', {
        url:'save-form.php',
        title: '検索条件',
        frame:true,
        bodyStyle:'padding:5px 5px 0',
        width: 800,
        fieldDefaults: {
            msgTarget: 'side'
        },
        defaultType: 'textfield',
        defaults: {
            anchor: '30%'
        },
        layout: 'hbox',

        items: [{
            fieldLabel: '保有ポイント数',
            labelWidth: 100,
            name: 'points',
            allowBlank:false,
            value: '1',
            width: 200
        },{
            fieldLabel: '除外ワード（スペース区切り）',
            labelWidth: 180,
            name: 'exWords',
            allowBlank:true,
            value: '',
            width: 500
        }],

        buttons: [{
            text: '検索',
            handler: function(){
              // フォーム値の取得
              var formValues = simple.getForm().getValues();

              // 除外ワードの処理
              var exWords = formValues["exWords"];
              var strExWords = "";
              if(exWords.trim().length !== 0) {
                var arrExWords = exWords.trim().split(" ");
                var arrExWordsLength = arrExWords.length;
                for(var i=0; i<arrExWordsLength; i++) {
                  if(strExWords !== "") {
                    strExWords = strExWords + " ";
                  }
                  strExWords = strExWords + "-" + arrExWords[i];
                }
              }

              store.getProxy().extraParams.price_to = formValues["points"];
              store.getProxy().extraParams.query = strExWords;
              store.loadPage(1);
            }
        }],
        renderTo: 'search-form'
    });

    // trigger the data store load
    store.loadPage(1);
});