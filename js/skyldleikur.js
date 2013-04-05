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
        
        this.questionsPerLevel = 5;
        this.questionsForLevel = {
            1 : [
                this.askPlaceAndYearOfBirth,
                this.askSibling,
                this.askCountSiblings,
                this.askChild,
                this.askGrandChild,
                this.askCountChildren,
                this.askCountGrandChildren,
                this.askParent,
                this.askAge
                ],
            2 : [
                this.askPlaceAndYearOfBirth,
                this.askSibling,
                this.askCountSiblings,
                this.askChild,
                this.askGrandChild,
                this.askCountChildren,
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
        this.getQuestionType = function( levelIndex ) {
            // TODO:  ólíkar tegundir spurninga eftir vægi
            return 0;
        };
        this.getQuestion = function( questionType, personIndex, gender ) {
            if( questionType === 0 ) {
               return this.askPlaceAndYearOfBirth( personIndex, gender );
            } else {
                return this.askPlaceAndYearOfBirth( personIndex, gender );
            }
        };
        
        this.askPlaceAndYearOfBirth = function( personIndex, gender ) {
            var person = this.getPerson( personIndex );
            var question = '';
            if( gender === 1 ) {
                question = 'Fæddur ';
            } else {
                question = 'Fædd ';
            }
            question += person.pob + ' ' + person.dob.substring(0,4);
            return question;
        };
        this.askSibling = function( personIndex, gender ) {
            
        };
        this.askCountSiblings = function( personIndex, gender ) {
            
        };
        this.askChild = function( personIndex, gender ) {
            
        };
        this.askGrandChild = function( personIndex, gender ) {
            
        };
        this.askCountChildren = function( personIndex, gender ) {
            
        };
        this.askCountGrandChildren = function( personIndex, gender ) {
            
        };
        this.askParent = function( personIndex, gender ) {
            
        };
        this.askRelatedVia = function( personIndex, gender ) {
            
        };
        this.askAge = function( personIndex, gender ) {
            
        };
        this.askMate = function( personIndex, gender ) {
            
        };
        
        var questionCandidates;  // = { index : {'personId':'...',','question':'...','correct':true|false} }
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
            var oneLevel = this.levels[levelIndex];
            var indexForPersonToPresent;
            var countCompletedPersons = oneLevel.endIndex - (oneLevel.startIndex-1);
            if( countCompletedPersons != oneLevel.progress ) {
                do {
                    indexForPersonToPresent = randomFromInterval( oneLevel.startIndex, oneLevel.endIndex );
// TODO: completed questions
                } while( oneLevel.completedIndexes[indexForPersonToPresent] );  // ef höfum afgreitt einstakling, tökum næsta
            }
            
            if( this.currentQuestion <= this.questionsPerLevel ) {
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
                var person = this.getPerson( indexForPersonToPresent ); // TODO: redundancy, getPerson called again in askPlaceAndYearOfBirth
                var questionType = this.getQuestionType( levelIndex );
                questionCandidates[1].question = this.getQuestion( questionType, questionCandidates[1].personIndex, person.gender );
                questionCandidates[2].question = this.getQuestion( questionType, questionCandidates[2].personIndex, person.gender );
                questionCandidates[3].question = this.getQuestion( questionType, questionCandidates[3].personIndex, person.gender );
                
                console.log( person.name + ':\n' + questionCandidates[1].question + (questionCandidates[1].correct ? ' -- rétt\n':'\n') + questionCandidates[2].question + (questionCandidates[2].correct ? ' -- rétt\n':'\n') + questionCandidates[3].question + (questionCandidates[3].correct ? ' -- rétt\n':'\n') );
                
                $('#question').text(person.name);
//                $('#answer1').text(questionCandidates[0].question);
//                $('#answer2').text(questionCandidates[1].question);
//                $('#answer3').text(questionCandidates[2].question);
                this.addAnswerButtons();
                levelResults[this.currentQuestion] = {};
                levelResults[this.currentQuestion].person = person.name;
                levelResults[this.currentQuestion].question = ''; // TODO
                levelResults[this.currentQuestion].startTime = new Date().getTime();
                $.mobile.loading( 'hide' );
                $.mobile.changePage('#s-skyldleikur-spurn');
                //$('#answer1, #answer2, #answer3').button('refresh');
                //$('#answer1, #answer2, #answer3').trigger('create');

            } else {  // allir laukar afgreiddir, sýnum lokastöðu
                $.mobile.loading( 'show', { text: 'Tek saman úrslit', textVisible:true});
                this.presentLevelResults();
            }
        };
        
        this.addAnswerButtons = function() {
            var answerButtonsContainer = $('#answer-buttons');
            answerButtonsContainer.empty();
            //$.each( questionCandidates, function( key, oneCandidate ){
            for( var k=1; k <= 3; k++ ) {
                var oneAnswer = $( '<a/>', {
                    'href':'#','data-role':'button','data-iconpos':'right',
                    'id':'answer'+k, 'class':'answer-button', 'data-candidate':k,
                    'text':questionCandidates[k].question
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

        
        
        ////// process question
        
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
                
                levelResults[this.currentQuestion].correctAnswer = questionCandidates[self.getCorrectAnswerIndex()].question;
                levelResults[this.currentQuestion].answeredCorrectly = answeredCorrectly;
                
                setTimeout( function(){
                    $.mobile.loading( 'show', { text: 'Sæki næstu spurningu', textVisible:true});
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
        
        
        this.getPerson = function( personIndex ) {
            var result;
            var self = this;
            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: '/ie/ib_app/get',
                data: { 'session': sessionId, 'id': self.ancestry[personIndex] },
                async: false,
                success: function( person ) {
                    result = person;
                }
            });
            return result;
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
    
    // TODO: kannski nota sniðmátadót eins og underscore eða mustache
    function getOneLevelListMarkup( levelIndex, linkTitle ) {
        var ul = $( '<ul/>', {'class':'levelentry', 'data-role': 'listview', 'data-inset':'true', html: '<li>Liður ' + levelIndex + '</li>' } );
        ul.append($('<li/>').append( $('<a/>', {'href':'#', 'data-transition':'slide','text':linkTitle, 'data-levelindex':levelIndex}) ) );
        //ul.append( '<li>' + levelTitle + '</li>' );
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
                //oneList.listview().trigger('create');
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
        einnSkyldleikur.startLevel( $(this).data('levelindex') );
    });
    $('#re-run-level').click(function(){
        einnSkyldleikur.startLevel( einnSkyldleikur.currentLevelIndex );
    });
    
    
    // REST þjónusta í ekki-utf-8 ftw!
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