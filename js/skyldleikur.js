/*jslint browser: true*/
/*global $, jQuery, alert, console */
/*jshint loopfunc: true */


$(function () {
//(function() {
    "use strict";
    
    // var IEAPIBaseUrl = 'http://www.islendingabok.is/ib_app';
    var IEAPIBaseUrl = '/ie';
    
    var IEUser = function () {
        
        var sessionId, userId, userName, userGender;
    };
    
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
        var levels;
        
        this.initialize = function() {
            levels = [];
            // setjum upphafs- og endavísa fyrir hvert borð / ættlegg / hæð í trénu
            var levelStartIndex = 1;
            var levelEndIndex = 1;
            levels.push( [levelStartIndex, levelEndIndex, true, 0] );
            while( levelEndIndex < this.ancestry.length ) {
                levelStartIndex = 2 * levelStartIndex;
                levelEndIndex = 2 * levelStartIndex - 1; // (2 * levelStartIndex) er vísir vinstra barns núverandi levelStartIndex
                levels.push( [levelStartIndex, levelEndIndex, false, 0] );
            }
            
            this.printAllLevelNames();
        };
        
        // debug
        this.printAllLevelNames = function() {
            var self = this;
            $.each( levels, function( index, oneLevel ) {
                console.log('level ' + (index+1) + ': ');
                var oneLevelStartIndex = oneLevel[0];
                var oneLevelEndIndex = oneLevel[1];
                for( var i = oneLevelStartIndex; i <= oneLevelEndIndex; i++ ) {
                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: '/ie/get',
                        data: { 'session': IEUser.sessionId, 'id': self.ancestry[i] },
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
        $.getJSON( '/ie/ancestors', { 'session': IEUser.sessionId, 'id': IEUser.userId } )
        .done( function( ancestors ) {
            
            einnSkyldleikur = new Skyldleikurinn( ancestors );
            
            $.mobile.changePage('#page-skyldleikur-index');
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ', ' + error;
            console.log( "Request Failed: " + err);
            // TODO: birta villuboð á forsíðu.
        });
   
    }
    
    function setUserFromLogin( loginData ) {
        var sessionAndId = loginData.split(',');
        IEUser.sessionId = sessionAndId[0];
        IEUser.userId = sessionAndId[1];
    }
    
    
    $("#login").submit(function () {
        alert('login!');
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
                    initializeSkyldleikurinn();
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