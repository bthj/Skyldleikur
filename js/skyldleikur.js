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
        
        this.askPlaceAndYearOfBirth = function( query ) {
            var question = {};
            question.title = 'fæddist';
            question.option = query.person.pob + ' ' + query.person.dob.substring(0,4);
            query.question = question;
            query.callback( query );
        };
        
        this.askRelation = function( query, title, restUrl ) {
            var question = {};
            question.title = title;
            $.getJSON( restUrl, { 'session': sessionId, 'id': query.person.id } )
            .done( function( relations ) {
                if( relations.length ) {
                    var oneRelation = relations[randomFromInterval(0, relations.length-1)];
                    question.option = self.getAllButLastName( oneRelation.name );
                    query.correctOptions = [];
                    if( query.canFailWithSelf ) {
                        if( $.inArray(question.option, query.correctOptions)  ) {
                            questionCandidates[query.questionPosition].correct = true;
                        }
                    } else {
                        $.each( relations, function( key, relationObject ){
                            query.correctOptions.push( self.getAllButLastName( relationObject.name ) );
                        });
                    }
                    query.question = question;
                    query.callback( query );
                } else {
                    if( query.canFailWithSelf ) {
                        question.option = self.getAllButLastName( query.person.name );
                        if( $.inArray(question.option, query.correctOptions) ) {
                            questionCandidates[query.questionPosition].correct = true;
                        }
                        query.question = question;
                        query.callback( query );
                    } else {
                        query.question = undefined;
                        query.callback( query );
                    }
                }
            });
        };
        this.askSibling = function( query ) {
            
            self.askRelation( query, 'á systkini sem heitir', '/ie/ib_app/siblings' );
        };
        this.askChild = function( query ) {
            
            self.askRelation( query, 'á barn sem heitir', '/ie/ib_app/children' );
        };
        
        this.askCountRelations = function( query, title, optionAppendix, restUrl ) {
            var question = {};
            question.title = title;
            if( query.canFailWithSelf ) {
                do {
                    question.option = randomFromInterval(1, 10) + optionAppendix;
                } while( ! $.inArray(question.option, query.correctOptions) );
                query.question = question;
                query.callback( query );
            } else {
                $.getJSON( restUrl, { 'session': sessionId, 'id': query.person.id } )
                .done( function( relations ) {
                    if( relations.length ) {
                        question.option = relations.length + optionAppendix;
                        query.correctOptions = [question.option];
                        query.question = question;
                        query.callback( query );
                    } else {
                        query.question = undefined;
                        query.callback( query );
                    }
                });                
            }
        };
        this.askCountSiblings = function( query ) {
            
            self.askCountRelations( query, 'á', ' systkini', '/ie/ib_app/siblings' );
        };
        this.askCountChildren = function( query ) {
            
            self.askCountRelations( query, 'á', ' börn', '/ie/ib_app/children' );
        };
        
        this.askGrandChild = function( query ) {
            query.question = undefined;
            query.callback( query );
        };
        this.askCountGrandChildren = function( query ) {
            query.question = undefined;
            query.callback( query );
        };
        this.askParent = function( query ) {
            query.question = undefined;
            query.callback( query );
        };
        this.askRelatedVia = function( query ) {
            query.question = undefined;
            query.callback( query );
        };
        
        this.calculateYearsBetweenDates = function( startDate, endDate ) {
            return endDate.getFullYear() - startDate.getFullYear();
        };
        this.getDateFromYearString= function( yearString ) { // YYYYMMDD
            return new Date( yearString.slice(0,4)+'-'+yearString.slice(4,6)+'-'+yearString.slice(6,8) );
        };
        this.getAppendixFromAge = function( age ){
            if( age > 11 && (age % 10) == 1 ) {
                return ' árs';
            } else {
                return ' ára';
            }
        };
        this.askAge = function( query ) {
            var question = {};
            var age;
            if( query.canFailWithSelf ) {
                question.title = query.title;
                var correctAge = parseInt(query.correctOptions[0].split(' ')[0], 10);
                do {
                    age = (correctAge + randomFromInterval(-10, 10));
                    question.option = age + self.getAppendixFromAge(age);
                } while( ! $.inArray(question.option, query.correctOptions) );
            } else {
                if( query.person.dod ) {
                    question.title = 'varð';
                    age = self.calculateYearsBetweenDates( 
                        self.getDateFromYearString(query.person.dob), 
                        self.getDateFromYearString(query.person.dod) );
                } else {
                    question.title = 'er';
                    age = self.calculateYearsBetweenDates( 
                        self.getDateFromYearString(query.person.dob), 
                        new Date() );
                }
                question.option = age + self.getAppendixFromAge(age);
                query.correctOptions = [question.option];
            }
            query.question = question;
            query.callback( query );
        };
        
        this.askMate = function( query ) {
            query.question = undefined;
            query.callback( query );
        };
        
        
        this.questionsPerLevel = 5;
        this.questionsForLevel = {
            1 : [
                this.askPlaceAndYearOfBirth,
                this.askSibling,
                this.askChild,
                this.askCountSiblings,
                this.askCountChildren,
                this.askGrandChild,
                this.askCountGrandChildren,
                this.askParent,
                this.askAge
                ],
            2 : [
                this.askPlaceAndYearOfBirth,
                this.askSibling,
                this.askChild,
                this.askCountSiblings,
                this.askCountChildren,
                this.askGrandChild,
                this.askCountGrandChildren,
                this.askParent,
                this.askAge
                ],
            3 : [
                this.askPlaceAndYearOfBirth,
                this.askRelatedVia,
                this.askAge
                ]
        };
        
        // askedForPerson -> { personId : [questionFunction, questionFunction]}, 
        //  svo sömu spurningar sé ekki spurt oftar en einu sinni fyrir hvern.
//        var askedForPerson = {}; 

        // veljum tegund spurningar af handahófi 
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
        this.handleQuestionForTarget = function( query ) {
            if( query.question ) {
                questionCandidates[query.questionPosition].questionTitle = query.question.title;
                questionCandidates[query.questionPosition].questionOption = query.question.option;
                for( var i=1; i <= 3; i++ ) {
                    if( i != query.questionPosition ) {
                        self.askForDistraction( i, query.questionFunction, query.correctOptions, query.question.title );
                    }
                }
            } else { // reynum aftur þangað til við fáum spurningu
                self.askForTarget( query );
            }            
        };
        this.askForTarget = function( query ) {
            var questionFunction = self.getQuestionFunction( query.levelIndex );
//            if( undefined === askedForPerson[query.person.id] ) askedForPerson[query.person.id] = [];
//            if( $.inArray( questionFunction, askedForPerson[query.person.id] ) > -1 ) {
//                self.askForTarget( query ); // höfum spurt áður, finnum aðra
//            } else {
//                askedForPerson[query.person.id].push( questionFunction );
                
                $('#question').text(query.person.name);
                levelResults[self.currentQuestion] = {};
                levelResults[self.currentQuestion].person = query.person.name;
                
                query.questionFunction = questionFunction;
                query.canFailWithSelf = false;
                query.callback = self.handleQuestionForTarget;
                questionFunction( query );                
//            }
        };
        
        //this.handleQuestionForDistraction = function( question, questionPosition) {
        this.handleQuestionForDistraction = function( query ) {
            questionCandidates[query.questionPosition].questionTitle = query.question.title;
            questionCandidates[query.questionPosition].questionOption = query.question.option;
            if( self.allQuestionOptionsReady() ) {
                self.addAnswerButtons();
                $.mobile.loading( 'hide' );
                levelResults[self.currentQuestion].startTime = new Date().getTime();
            }
        };
        this.askForDistraction = function( questionPosition, questionFunction, correctOptions, title ) {
            var personId = self.ancestry[questionCandidates[questionPosition].personIndex];
            $.getJSON( '/ie/ib_app/get', { 'session': sessionId, 'id': personId } )
            .done( function( person ) {
                var query = {'person':person, 'canFailWithSelf':true, 'correctOptions':correctOptions, 'title':title,
                             'questionPosition':questionPosition, 'callback':self.handleQuestionForDistraction};
                questionFunction( query );
            });
        };
        
        
        var questionCandidates;  // = { index : {'personIndex':'...',','questionTitle':'...','questionOption','correct':true|false} }
        var levelResults; // = { index: {'person':'...','question':'...','correctAnswer':'...', answeredCorrectly:true|false}, startTime:1000, endTime:2000, score: 100 }
        this.currentQuestion = 0;
        this.currentLevelIndex = 0;
        this.startLevel = function( levelIndex ) {
            $.mobile.loading( 'show', { text: 'Sæki spurningu', textVisible:true});
            levelResults = {};
//            askedForPerson = {};
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
                    var query = {'person':person, 'levelIndex':levelIndex, 'questionPosition':questionDisplayIndexes[2]};
                    self.askForTarget( query );
                });

            } else {  // allir laukar afgreiddir, sýnum lokastöðu

                this.presentLevelResults();
            }
        };
        
        this.addAnswerButtons = function() {
            var answerButtonsContainer = $('#answer-buttons');
            answerButtonsContainer.empty();
            answerButtonsContainer.append( $('<p/>', {
                'html':'<strong>'+questionCandidates[1].questionTitle+'</strong>', 'style':'text-align:center;'}) );
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
                var correctCandidate;
                if( answeredCorrectly ) {
                    self.highlightCorrectAnswer( selectedCandicateIndex );
                    $('#correctPopup').popup('open', {theme: "b", overlayTheme: "b", positionTo: button, transition: "pop", x: "10" });
                    correctCandidate = questionCandidates[selectedCandicateIndex];
                } else {
                    self.highlightWrongAnswer( selectedCandicateIndex );
                    self.highlightCorrectAnswer();
                    correctCandidate = questionCandidates[self.getCorrectAnswerIndex()];
                }
                self.setProgressStatus( answeredCorrectly );
                
                levelResults[this.currentQuestion].correctAnswer = correctCandidate.questionTitle + ' ' + correctCandidate.questionOption;
                levelResults[this.currentQuestion].answeredCorrectly = answeredCorrectly;
                
                setTimeout( function(){
                    $.mobile.loading( 'show', { text: 'Sæki...', textVisible:true});
                    self.presentQuestion(self.currentLevelIndex);
                }, 1000);
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
            $('#results-count-correct').html('<strong>'+correctCount + ' af 5</strong> svarað rétt');
            var meanAnswerTime = ((totalAnswerTime/1000) / 5).toFixed(1);
            $('#results-mean-answer-time').html('meðalsvartími <strong>'+meanAnswerTime+' sekúndur</strong>');
            $('#results-total-points').text(totalPoints+' stig');
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