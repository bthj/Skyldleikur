/*jslint browser: true*/
/*global $, jQuery, alert*/


$(function () {
    "use strict";
    
    var IEUser = function () {
        
        var sessionId, userId;
    };
    
    
    $("#login").submit(function () {
        
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: '/ie/login',
            data: { 'user': $('#name').val(), 'pwd': $('#password').val() },
            success: function (data) {
                if( data.indexOf("Invalid") >= 0 ) {
                    alert('login failed');    
                } else {
                    $.mobile.changePage('#page-skyldleikur-index');
                }
                
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('error, jqXHR:' + jqXHR + 'textStatus: ' + textStatus + ', errorThrown: ' + errorThrown );
            }
        });
        return false;
    });
    
});