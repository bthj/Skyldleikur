/*jslint browser: true*/
/*global $, jQuery, alert, console */
/*jshint loopfunc: true */


$(function () {
//(function() {
    "use strict";
    
    // var IEAPIBaseUrl = 'http://www.islendingabok.is/ib_app';
    var IEAPIBaseUrl = '/ie';
    
    var user;
    var sessionId;
    
    var einnSkyldleikur;
    
    
    var Skyldleikurinn = function( initialAncestry ) {
        this.ancestry = initialAncestry;
        /**
         * levels er fylki af fylkjum fyrir hvert borð, þar sem hvert þeirra inniheldur:
         * [0] startIndex fyrir þetta level í forfeðrafylki
         * [1] endIndex fyrir þetta level í forfeðrafylki
         * [2] unlocked:  true / false
         * [3] stars:  með hve góðum árangri var þetta borð klárað (fjöldi stjarna 1-3) ?
        */
        this.levels = [];
        
        this.initialize = function() {
            this.levels = [];
            // setjum upphafs- og endavísa fyrir hvert borð / ættlegg / hæð í trénu
            var levelStartIndex = 1;
            var levelEndIndex = 1;
            this.levels.push( [levelStartIndex, levelEndIndex, true, 0] );
            while( levelEndIndex < this.ancestry.length ) {
                levelStartIndex = 2 * levelStartIndex;
                levelEndIndex = 2 * levelStartIndex - 1; // (2 * levelStartIndex) er vísir vinstra barns núverandi levelStartIndex
                this.levels.push( [levelStartIndex, levelEndIndex, false, 0] );
            }
            
            // this.printAllLevelNames();
        };
        
        
        
        // debug
        this.printAllLevelNames = function() {
            var self = this;
            $.each( self.levels, function( index, oneLevel ) {
                console.log('level ' + (index+1) + ': ');
                var oneLevelStartIndex = oneLevel[0];
                var oneLevelEndIndex = oneLevel[1];
                for( var i = oneLevelStartIndex; i <= oneLevelEndIndex; i++ ) {
                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: '/ie/get',
                        data: { 'session': sessionId, 'id': self.ancestry[i] },
                        async: false,
                        success: function( person ) {
                            console.log( index + ' - ' + person.name );
                        }
                    });
                }
            });
        };
        
        this.initialize();
    };
    
    function initializeSkyldleikurinn() {
        
        // sækjum framættartré og upphafsstillum hlut Skyldleikjar
        $.getJSON( '/ie/ancestors', { 'session': sessionId, 'id': user.id } )
        .done( function( ancestors ) {
            
            einnSkyldleikur = new Skyldleikurinn( ancestors );
            
            $.mobile.changePage('#s-skyldleikur');
            var greeting;
            switch( user.gender ) {
                case 0:
                    greeting = 'Velkomin, ';
                    break;
                case 1:
                    greeting = 'Velkominn, ';
                    break;
                default:
                    greeting = 'Velkomin/n, ';
                    break;
            }
            $('#s-skyldleikur div[data-role="content"] h1').text(greeting + user.name + ', til Skyldleika!');
            showLevels();
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ', ' + error;
            console.log( "Request Failed: " + err);
            // TODO: birta villuboð á forsíðu.
        });
   
    }
    
    // TODO: kannski nota sniðmátadót eins og underscore eða mustache
    function getOneLevelListMarkup( levelTitle, linkTitle ) {
        var ul = $( '<ul/>', {'data-role': 'listview', 'data-inset':'true', html: '<li>' + levelTitle + '</li>' } );
        ul.append($('<li/>').append( $('<a/>', {'href':'#', 'data-transition':'slide','text':linkTitle}) ) );
        //ul.append( '<li>' + levelTitle + '</li>' );
        return ul;
    }
    function showLevels() {
        $.each( einnSkyldleikur.levels, function(index, levelData){
            var linkTitle = '';
            if( index == 1 ) { // mamma og pabbi
                linkTitle = "Foreldrar";
            } else if( index == 2 ) { // ömmur og afar
                linkTitle = "Ömmurnar og afarnir";
            } else if( index == 3 ) { // langömmur og -afar
                linkTitle = "Langömmurnar og -afarnir";
            } else if( index > 3 ) {
                for( var i=index; i > 3; i-- ) {
                    if( i == index ) {
                        linkTitle += "Langa-";
                    } else {
                        linkTitle += "langa-";
                    }
                }
                linkTitle += "langömmurnar og -afarnir";
            }
            if( index > 0 ) {
                var oneList = getOneLevelListMarkup('Borð '+index, linkTitle);
                $('#s-skyldleikur div[data-role="content"]').append( oneList );
                //oneList.listview().trigger('create');
                oneList.listview();                
            }
        });
        
    }
    
    function setUserFromLogin( loginData ) {
        var sessionAndId = loginData.split(',');
        sessionId = sessionAndId[0];
        $.getJSON( '/ie/get', { 'session': sessionId, 'id': sessionAndId[1] } )
        .done( function( person ) {
            
            user = person;
            initializeSkyldleikurinn();
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ', ' + error;
            console.log( "Request Failed: " + err);
            // TODO: birta villuboð á síðu.
        });
    }
    
    
    $("#login").submit(function () {
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: '/ie/login',
            data: { 'user': $('#name').val(), 'pwd': $('#password').val() },
            success: function ( loginData ) {
                if( loginData.indexOf("Invalid") >= 0 ) {
                    alert('login failed');    
                } else {
                    setUserFromLogin( loginData );
                }
                
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert( 'error, jqXHR:' + jqXHR + 'textStatus: ' + textStatus + ', errorThrown: ' + errorThrown );
                // TODO: birta villuboð á forsíðu.
            }
        });
        return false;
    });
    
});
//})();