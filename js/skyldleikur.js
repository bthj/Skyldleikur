/*jslint browser: true*/
/*global $, jQuery, alert, console */
/*jshint loopfunc: true */

//var einnSkyldleikur;

$(function () {
//(function() {
    "use strict";
    
    // var IEAPIBaseUrl = 'http://www.islendingabok.is/ib_app';
    var IEAPIBaseUrl = '/ie/ib_app';
    
    var user;
    var sessionId;
    
    var einnSkyldleikur;
    
    
    var Skyldleikurinn = function( initialAncestry ) {
        var self = this;
        
        this.ancestry = initialAncestry;
        /**
         * levels er fylki af hlutum fyrir hvert borð, þar sem hvert þeirra inniheldur:
         * startIndex fyrir þetta level í forfeðrafylki
         * endIndex fyrir þetta level í forfeðrafylki
         * unlocked:  true / false
         * stars:  með hve góðum árangri var þetta borð klárað (fjöldi stjarna 1-3) ?
         * progress:  fyrir hve marga hefur verið svarað rétt
         * completedIndexes:  hlutur með vísum >= startIndex og <= endIndex sem lyklum og 
         *  gildum sem segja til um hvort vísir (einstaklingur) sé afgreiddur
         *      {2:false, 3:true, osfrv...}
        */
        this.levels = [];

        
        this.getAllButLastName = function( name ) {
            var nameParts = name.split(' ');
            return nameParts.slice(0,nameParts.length-1).join(' ');
        };
        
        this.askPlaceAndYearOfBirth = function( person, canFailWithSelf, questionPosition, callback, levelIndex, questionFunction ) {
            var question = {};
            question.title = 'fæddist';
            question.option = person.pob + ' ' + person.dob.substring(0,4);
            callback( question, questionPosition, person, levelIndex, questionFunction );
        };
        this.askSibling = function( person, canFailWithSelf, questionPosition, callback, levelIndex, questionFunction ) {
            var question = {};
            question.title = 'á systkini sem heitir';
            $.getJSON( '/ie/ib_app/siblings', { 'session': sessionId, 'id': person.id } )
            .done( function( siblings ) {
                if( siblings.length ) {
                    var oneSibling = siblings[randomFromInterval(0, siblings.length-1)];
                    question.option = self.getAllButLastName( oneSibling.name );
                    callback( question, questionPosition, person, levelIndex, questionFunction );
                } else {
                    if( canFailWithSelf ) {
                        question.option = self.getAllButLastName( person.name );
                        callback( question, questionPosition, person, levelIndex, questionFunction );
                    } else {
                        callback( undefined, questionPosition, person, levelIndex, questionFunction );
                    }
                }
            });
        };
        this.askCountSiblings = function( person, canFailWithSelf, questionPosition, callback, levelIndex, questionFunction ) {
            var question = {};
            question.title = 'á';
            if( canFailWithSelf ) {
                question.option = randomFromInterval(1, 10) + ' systkini';
                callback( question, questionPosition, person, levelIndex, questionFunction );
            } else {
                $.getJSON( '/ie/ib_app/siblings', { 'session': sessionId, 'id': person.id } )
                .done( function( siblings ) {
                    if( siblings.length ) {
                        question.option = siblings.length + ' systkini';
                        callback( question, questionPosition, person, levelIndex, questionFunction );
                    } else {
                        callback( undefined, questionPosition, person, levelIndex, questionFunction );
                    }
                });                
            }
        };
        this.askChild = function( person, canFailWithSelf, questionPosition, callback, levelIndex, questionFunction ) {
            var question = {};
            question.title = 'á barn sem heitir';
            $.getJSON( '/ie/ib_app/children', { 'session': sessionId, 'id': person.id } )
            .done( function( children ) {
                if( children.length ) {
                    var oneChild = children[randomFromInterval(0, children.length-1)];
                    question.option = self.getAllButLastName( oneChild.name );
                    callback( question, questionPosition, person, levelIndex, questionFunction );
                } else {
                    if( canFailWithSelf ) {
                        question.option = self.getAllButLastName( person.name );
                        callback( question, questionPosition, person, levelIndex, questionFunction );
                    } else {
                        callback( undefined, questionPosition, person, levelIndex, questionFunction );
                    }
                }
            });
        };
        this.askGrandChild = function( person, canFailWithSelf ) {
            return undefined;
        };
        this.askCountChildren = function( person, canFailWithSelf ) {
            return undefined;
        };
        this.askCountGrandChildren = function( person, canFailWithSelf ) {
            return undefined;
        };
        this.askParent = function( person, canFailWithSelf ) {
            return undefined;
        };
        this.askRelatedVia = function( person, canFailWithSelf ) {
            return undefined;
        };
        this.askAge = function( person, canFailWithSelf ) {
            return undefined;
        };
        this.askMate = function( person, canFailWithSelf ) {
            return undefined;
        };
        
        
        this.questionsPerLevel = 5;
        this.questionsForLevel = {
            1 : [
                this.askPlaceAndYearOfBirth,
                this.askSibling,
                this.askCountSiblings,
                this.askChild
//                this.askGrandChild,
//                this.askCountChildren,
//                this.askCountGrandChildren,
//                this.askParent,
//                this.askAge
                ],
            2 : [
                this.askPlaceAndYearOfBirth,
                this.askSibling,
                this.askCountSiblings,
                this.askChild
//                this.askGrandChild,
//                this.askCountChildren,
//                this.askCountGrandChildren,
//                this.askParent,
//                this.askAge
                ],
            3 : [
                this.askPlaceAndYearOfBirth,
                this.askRelatedVia,
                this.askAge
                ]
        };

        // this.getQuestion = function( questionType, personIndex, gender ) {
        this.getQuestionFunction = function( levelIndex ) {
            if( levelIndex > 3 ) levelIndex = 3;
            var functionIndex = randomFromInterval( 0, this.questionsForLevel[levelIndex].length-1 );
            return this.questionsForLevel[levelIndex][functionIndex];
        };
        
        this.allQuestionOptionsReady = function() {
            var allReady = true;
            $.each( questionCandidates, function( key, oneCandidate ){
                if( undefined === oneCandidate ) allReady = false;
            });
            return allReady;
        };
        
        // fáum spurningu fyrir manneskjuna sem við höfum í huga
        this.handleQuestionForTarget = function( question, questionPosition, person, levelIndex, questionFunction ) {
            if( question ) {
                questionCandidates[questionPosition].questionTitle = question.title;
                questionCandidates[questionPosition].questionOption = question.option;
                for( var i=1; i <= 3; i++ ) {
                    if( i != questionPosition ) self.askForDistraction( i, questionFunction );
                }
            } else { // köllum í okkur sjálf þangað til við fáum spurningu
                this.askForTarget(  person, levelIndex, questionPosition );
            }            
        };
        this.askForTarget = function( person, levelIndex, questionPosition ) {
            $('#question').text(person.name);
            levelResults[this.currentQuestion] = {};
            levelResults[this.currentQuestion].person = person.name;
            //levelResults[this.currentQuestion].question = question;
            
            var questionFunction = this.getQuestionFunction( levelIndex );
            //var question = 
            questionFunction( person, false, questionPosition, this.handleQuestionForTarget, levelIndex, questionFunction );
        };
        
        this.handleQuestionForDistraction = function( question, questionPosition) {
            questionCandidates[questionPosition].questionTitle = question.title;
            questionCandidates[questionPosition].questionOption = question.option;
            if( self.allQuestionOptionsReady() ) {
                self.addAnswerButtons();
                $.mobile.loading( 'hide' );
                levelResults[self.currentQuestion].startTime = new Date().getTime();
            }
        };
        this.askForDistraction = function( questionPosition, questionFunction ) {
            var personId = self.ancestry[questionCandidates[questionPosition].personIndex];
            $.getJSON( '/ie/ib_app/get', { 'session': sessionId, 'id': personId } )
            .done( function( person ) {
                //var question = 
                questionFunction( person, true, questionPosition, self.handleQuestionForDistraction );
            });
        };
        
        
        var questionCandidates;  // = { index : {'personIndex':'...',','questionTitle':'...','questionOption','correct':true|false} }
        var levelResults; // = { index: {'person':'...','question':'...','correctAnswer':'...', answeredCorrectly:true|false}, startTime:1000, endTime:2000, score: 100 }
        this.currentQuestion = 0;
        this.currentLevelIndex = 0;
        this.startLevel = function( levelIndex ) {
            $.mobile.loading( 'show', { text: 'Sæki spurningu', textVisible:true});
            levelResults = {};
            this.currentQuestion = 0;
            this.currentLevelIndex  = levelIndex;
            this.addInfoSteps();
            this.presentQuestion( levelIndex );
            $('#s-skyldleikur-spurn h1:first').text('Ættliður '+ levelIndex);
        };
    
        this.presentQuestion = function( levelIndex ) {
            this.currentQuestion++;
            $('#question, #answer-buttons').empty();
            
            if( this.currentQuestion <= this.questionsPerLevel ) {
                $('#correctPopup').popup('close');
                
                var oneLevel = this.levels[levelIndex];
                var indexForPersonToPresent;
                var countCompletedPersons = oneLevel.endIndex - (oneLevel.startIndex-1);
                if( countCompletedPersons != oneLevel.progress ) {
                    do {
                        indexForPersonToPresent = randomFromInterval( oneLevel.startIndex, oneLevel.endIndex );
                        // TODO: completed questions
                    } while( oneLevel.completedIndexes[indexForPersonToPresent] );  // ef höfum afgreitt einstakling, tökum næsta
                }
                
                // sækjum ranga möguleika
                var ancestryStartIndex;
                if( levelIndex == 1 ) { // við erum að skoða foreldrana, tökum þig með líka
                    ancestryStartIndex = 1;
                } else {
                    ancestryStartIndex = oneLevel.startIndex;
                }
                var wrongAncestryIndexes = [];
                for( var i=0; i < 2; i++ ) {
                    var oneWrongAncestryIndex = randomFromInterval(ancestryStartIndex, oneLevel.endIndex);
                    if( oneWrongAncestryIndex == indexForPersonToPresent || 
                       $.inArray(oneWrongAncestryIndex, wrongAncestryIndexes) > -1 ) {
                        i--;
                    } else {
                        wrongAncestryIndexes[i] = oneWrongAncestryIndex;
                    }
                }
                // birtum réttan og ranga möguleika í einhverri röð
                var questionDisplayIndexes = [];
                for( var j=1; j <= 3; j++ ) {
                    var oneDisplayIndex = randomFromInterval(1,3);
                    if( $.inArray(oneDisplayIndex, questionDisplayIndexes) > -1 ) {  
                        j--;  // reynum random aftur
                    } else {
                        questionDisplayIndexes.push( oneDisplayIndex );
                    }
                }
                
                questionCandidates = {};

                for( var k=0; k < 3; k++ ) questionCandidates[questionDisplayIndexes[k]] = {};
                questionCandidates[questionDisplayIndexes[0]].personIndex = wrongAncestryIndexes[0];
                questionCandidates[questionDisplayIndexes[1]].personIndex = wrongAncestryIndexes[1];
                questionCandidates[questionDisplayIndexes[2]].personIndex = indexForPersonToPresent;
                questionCandidates[questionDisplayIndexes[2]].correct = true;
                
                $.getJSON( '/ie/ib_app/get', { 'session': sessionId, 'id': self.ancestry[indexForPersonToPresent] } )
                .done( function( person ) {
                    self.askForTarget( person, levelIndex, questionDisplayIndexes[2] );
                });

            } else {  // allir laukar afgreiddir, sýnum lokastöðu

                this.presentLevelResults();
            }
        };
        
        this.addAnswerButtons = function() {
            var answerButtonsContainer = $('#answer-buttons');
            answerButtonsContainer.empty();
            answerButtonsContainer.append( $('<p/>', {'text':questionCandidates[1].questionTitle}) );
            //$.each( questionCandidates, function( key, oneCandidate ){
            for( var k=1; k <= 3; k++ ) {
                var oneAnswer = $( '<a/>', {
                    'href':'#','data-role':'button','data-iconpos':'right',
                    'id':'answer'+k, 'class':'answer-button', 'data-candidate':k,
                    'text':questionCandidates[k].questionOption
                });
                answerButtonsContainer.append( oneAnswer ).append('<br/>');
            }
            //});
            answerButtonsContainer.trigger('create');
        };
        
        this.addInfoSteps = function(){
            var stepButtonsContainer = $('#step-buttons').empty();
            stepButtonsContainer.empty();
            var controlGroup = $('<div/>', {'data-role':'controlgroup','data-type':'horizontal', 'data-mini':'true'});
            for( var i=1; i <= 5; i++ ) {
                var oneStep = $('<a/>',{'href':'#', 'id':'stepinfo'+i,'data-role':'button','data-iconpos':'left'});
                controlGroup.append( oneStep );
            }
            stepButtonsContainer.append(controlGroup);
            stepButtonsContainer.trigger("create");
        };

        
        
        ////// process answer
        
        self.getCorrectAnswerIndex = function() {
            var correctIndex;
            $.each( questionCandidates, function( key, oneCandidate ){
                if( oneCandidate.correct ) correctIndex = key;
            });
            return correctIndex;
        };
        this.highlightCorrectAnswer = function( index ) {
            if( undefined === index ) index = self.getCorrectAnswerIndex();
            //$('#answer'+(index+1)).buttonMarkup({theme: 'b', icon:'check'}).trigger("create");
            $('#answer'+index).buttonMarkup({theme: 'b', icon:'check'});
        };
        this.highlightWrongAnswer = function( index ) {
            $('#answer'+index).buttonMarkup({theme: 'a', icon:'delete'});
        };
        this.setProgressStatus = function( answeredCorrectly ) {
            if( answeredCorrectly ) {
                $('#stepinfo'+this.currentQuestion).buttonMarkup({theme:'b', icon:'check'});
                $('#stepinfo'+this.currentQuestion+' .ui-btn-text').text(':-)');
            } else {
                $('#stepinfo'+this.currentQuestion).buttonMarkup({theme:'a', icon:'delete'});
                $('#stepinfo'+this.currentQuestion+' .ui-btn-text').text(':-(');
            }
        };
        this.processAnswer = function( button ) {
            // TODO: handle if multiple idendical choices
            var self = this;
            if( undefined === levelResults[this.currentQuestion].endTime ) {
                levelResults[this.currentQuestion].endTime = new Date().getTime();
                var selectedCandicateIndex = button.data('candidate');
                var answeredCorrectly = questionCandidates[selectedCandicateIndex].correct;
                if( answeredCorrectly ) {
                    self.highlightCorrectAnswer( selectedCandicateIndex );
                    $('#correctPopup').popup('open', {theme: "b", overlayTheme: "b", positionTo: button, transition: "pop", x: "10" });
                } else {
                    self.highlightWrongAnswer( selectedCandicateIndex );
                    self.highlightCorrectAnswer();
                }
                self.setProgressStatus( answeredCorrectly );
                
                var correctCandidate = questionCandidates[self.getCorrectAnswerIndex()];
                levelResults[this.currentQuestion].correctAnswer = correctCandidate.questionTitle + ' ' + correctCandidate.questionOption;
                levelResults[this.currentQuestion].answeredCorrectly = answeredCorrectly;
                
                setTimeout( function(){
                    $.mobile.loading( 'show', { text: 'Sæki...', textVisible:true});
                    self.presentQuestion(self.currentLevelIndex);
//                    setTimeout( function(){
//                        self.presentQuestion(self.currentLevelIndex);
//                    }, 50);
                }, 950);
            }
        };
        
        
        
        ////// level results
        
        this.presentLevelResults = function() {
            var answerContainer = $('#results-container').empty();
            var resultList = $('<ul/>', {'data-role':'listview', 'data-inset':'true'});
            var correctCount = 0;
            var totalAnswerTime = 0;
            var totalPoints = 0;
            $.each(levelResults, function(questionNo, result){
                var oneListItem = $('<li/>');
                var splitLeft = $('<a/>', {'href':'#'} );
                splitLeft.append( $('<h2/>', {'text': levelResults[questionNo].person}) );
                splitLeft.append( $('<p/>', {'text': levelResults[questionNo].correctAnswer}) );
                oneListItem.append( splitLeft );
                var oneAnswerTime = levelResults[questionNo].endTime - levelResults[questionNo].startTime;
                totalAnswerTime += oneAnswerTime;
                if( levelResults[questionNo].answeredCorrectly ) {
                    oneListItem.append( $('<a/>', {'href':'#', 'data-theme':'b', 'data-icon':'check'}) );
                    totalPoints += Math.round(100 / (oneAnswerTime/1000));
                    correctCount++;
                } else {
                    oneListItem.append( $('<a/>', {'href':'#', 'data-theme':'a', 'data-icon':'delete'}) );
                }
                resultList.append( oneListItem );
            });
            $('#results-count-correct').text(correctCount + ' af 5 svarað rétt!');
            var meanAnswerTime = ((totalAnswerTime/1000) / 5).toFixed(1);
            $('#results-mean-answer-time').text('Meðalsvartími '+meanAnswerTime+' sekúndur');
            $('#results-total-points').find('strong:first').text(totalPoints+' stig');
            $.mobile.changePage('#s-skyldleikur-stada');
            answerContainer.append( resultList );
            answerContainer.trigger('create');
        };
        
        
        
        function randomFromInterval(from,to) {
            return Math.floor(Math.random()*(to-from+1)+from);
        }
        
        this.initialize = function() {
            this.levels = [];
            // setjum upphafs- og endavísa fyrir hvert borð / ættlegg / hæð í trénu
            var levelStartIndex = 1;
            var levelEndIndex = 1;
            this.levels.push( {
                'startIndex':levelStartIndex, 
                'endIndex':levelEndIndex, 
                'unlocked':true, 'stars':0, 'progress':0, 'completedIndexes':{}} );
            while( levelEndIndex < this.ancestry.length ) {
                levelStartIndex = 2 * levelStartIndex;
                levelEndIndex = 2 * levelStartIndex - 1; // (2 * levelStartIndex) er vísir vinstra barns núverandi levelStartIndex
                this.levels.push( {
                    'startIndex':levelStartIndex, 
                    'endIndex':levelEndIndex, 
                    'unlocked':false, 'stars':0, 'progress':0, 'completedIndexes':{}} );
            }
            
            // events
            $('.answer-button').live('click', function(){ // TODO: set event listener once?
                self.processAnswer( $(this) );
            });
            
            // this.printAllLevelNames();
        };
        
        
        // debug
        this.printAllLevelNames = function() {
            var self = this;
            $.each( self.levels, function( index, oneLevel ) {
                console.log('level ' + (index+1) + ': ');
                for( var i = oneLevel.startIndex; i <= oneLevel.endIndex; i++ ) {
                    $.ajax({
                        type: 'GET',
                        dataType: 'json',
                        url: '/ie/ib_app/get',
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
        $.getJSON( '/ie/ib_app/ancestors', { 'session': sessionId, 'id': user.id } )
        .done( function( ancestors ) {
            
            einnSkyldleikur = new Skyldleikurinn( ancestors );
            
            $.mobile.changePage('#s-skyldleikur');
            
            var greeting;
            switch( user.gender ) {
                case 2:
                    greeting = 'Velkomin, ';
                    break;
                case 1:
                    greeting = 'Velkominn, ';
                    break;
                default:
                    greeting = 'Velkomin/n, ';
                    break;
            }
            $('#s-skyldleikur div[data-role="content"] h1').text(greeting + user.name + '!');
            showLevels();
        })
        .fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ', ' + error;
            console.log( "Request Failed: " + err);
            // TODO: birta villuboð á forsíðu.
        });
   
    }
    

    function getOneLevelListMarkup( levelIndex, linkTitle ) {
        var ul = $( '<ul/>', {'class':'levelentry', 'data-role': 'listview', 'data-inset':'true', html: '<li>Liður ' + levelIndex + '</li>' } );
        ul.append($('<li/>').append( $('<a/>', {'href':'#', 'data-transition':'slide','text':linkTitle, 'data-levelindex':levelIndex}) ) );
        return ul;
    }
    function showLevels() {
        var levelsContainer = $('#levels-container');
        levelsContainer.empty();
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
                var oneList = getOneLevelListMarkup( index, linkTitle );
                levelsContainer.append( oneList );
                oneList.listview();                
            }
        });
        
    }
    
    function setUserFromLogin( loginData ) {
        var sessionAndId = loginData.split(',');
        sessionId = sessionAndId[0];
        $.getJSON( '/ie/ib_app/get', { 'session': sessionId, 'id': sessionAndId[1] } )
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
    
    
    // events
    
    $('#login').submit(function () {
        $.mobile.loading( 'show', { text: 'Skrái inn', textVisible:true});
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: '/ie/ib_app/login',
            data: { 'user': $('#name').val(), 'pwd': $('#password').val() },
            success: function ( loginData ) {
                if( loginData.indexOf("Invalid") >= 0 ) {
                    alert('Innskráning tókst ekki');
                    $.mobile.loading( 'hide' );
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

    $('ul.levelentry a').live('click', function(event){
        $.mobile.changePage('#s-skyldleikur-spurn');
        einnSkyldleikur.startLevel( $(this).data('levelindex') );
        //return false;
    });
    $('#re-run-level').click(function(){
        $.mobile.changePage('#s-skyldleikur-spurn');
        einnSkyldleikur.startLevel( einnSkyldleikur.currentLevelIndex );
        return false;
    });
    
    
    // REST-þjónusta-í-ekki-utf-8-tækl !
    $.ajaxSetup({
        contentType: "text/plain; charset=iso-8859-1",
        beforeSend: function(jqXHR) {
            jqXHR.overrideMimeType("text/plain;charset=iso-8859-1");
        }
    });


    // stillum af leikinn þegar forsíðan en endurhlaðin
    $( document ).delegate("#s-skyldleikur", "pageinit", function() {
        if( einnSkyldleikur ) {
            showLevels();
        } else {
            $.mobile.changePage('#s-login');
        }
    });
    $( document ).delegate("#s-skyldleikur-spurn, #s-skyldleikur-stada", "pageinit", function() {
        if( ! einnSkyldleikur ) {
            $.mobile.changePage('#s-login');
        }
    });    
    
});
//})();