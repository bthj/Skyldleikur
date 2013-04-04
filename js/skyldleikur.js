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
        this.questionTypes = {
            0 : 'askPlaceAndYearOfBirth'
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
        this.askChild = function( personIndex, gender ) {
            
        };
        this.askParent = function( personIndex, gender ) {
            
        };
        this.askRelatedVia = function( personIndex, gender ) {
            
        };
        
        var questionCandidates;  // = { index : {'personId':'...',','question':'...','correct':true|false} }
        var levelResults; // = { index: {'correctAnswer':'...', answeredCorrectly:true|false}, score: 100 }
        var currentQuestion;
        var currentLevelIndex;
        this.startLevel = function( levelIndex ) {
            levelResults = {};
            currentQuestion = 0;
            currentLevelIndex  = levelIndex;
            this.presentQuestion( levelIndex );
        };
        this.presentQuestion = function( levelIndex ) {
            currentQuestion++;
            var oneLevel = this.levels[levelIndex];
            var indexForPersonToPresent;
            var countCompletedPersons = oneLevel.endIndex - (oneLevel.startIndex-1);
            if( countCompletedPersons != oneLevel.progress ) {
                do {
                    indexForPersonToPresent = randomFromInterval( oneLevel.startIndex, oneLevel.endIndex );
                } while( oneLevel.completedIndexes[indexForPersonToPresent] );  // ef höfum afgreitt einstakling, tökum næsta
            }
            if( indexForPersonToPresent ) {
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
                $.mobile.changePage('#s-skyldleikur-spurn');
                //$('#answer1, #answer2, #answer3').button('refresh');
                //$('#answer1, #answer2, #answer3').trigger('create');

            } else {  // allir laukar afgreiddir, sýnum lokastöðu
                
                this.presentLevelResults();
            }
        };
        
        this.addAnswerButtons = function() {
            var answerButtonsContainer = $('#answer-buttons');
            answerButtonsContainer.empty();
            $.each( questionCandidates, function( key, oneCandidate ){
                var oneAnswer = $( '<a/>', {
                    'href':'#','data-role':'button','data-iconpos':'right',
                    'id':'answer'+key, 'class':'answer-button', 'data-candidate':key,
                    'text':questionCandidates[key].question
                });
                answerButtonsContainer.append( oneAnswer ).append('<br/>');
            });
            answerButtonsContainer.trigger('create');
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
                $('#stepinfo'+currentQuestion).buttonMarkup({theme:'b', icon:'check'});
                $('#stepinfo'+currentQuestion+' .ui-btn-text').text('rétt');
            } else {
                $('#stepinfo'+currentQuestion).buttonMarkup({theme:'a', icon:'delete'});
                $('#stepinfo'+currentQuestion+' .ui-btn-text').text('rangt');
            }
        };
        this.processAnswer = function( button ) {
            // TODO: handle if multiple idendical choices
            if( undefined === levelResults[currentQuestion] ) {
                var selectedCandicateIndex = button.data('candidate');
                var answeredCorrectly = questionCandidates[selectedCandicateIndex].correct;
                if( answeredCorrectly ) {
                    self.highlightCorrectAnswer( selectedCandicateIndex );
                } else {
                    self.highlightWrongAnswer( selectedCandicateIndex );
                    self.highlightCorrectAnswer();
                }
                self.setProgressStatus( answeredCorrectly );
                
                levelResults[currentQuestion] = {};
                levelResults[currentQuestion].correctAnswer = questionCandidates[self.getCorrectAnswerIndex()];
                levelResults[currentQuestion].answeredCorrectly = answeredCorrectly;
                
                setTimeout( function(){self.presentQuestion(currentLevelIndex);}, 3000);       
            }
        };
        
        this.presentLevelResults = function() {
            
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
    function getOneLevelListMarkup( levelIndex, linkTitle ) {
        var ul = $( '<ul/>', {'class':'levelentry', 'data-role': 'listview', 'data-inset':'true', html: '<li>Borð ' + levelIndex + '</li>' } );
        ul.append($('<li/>').append( $('<a/>', {'href':'#', 'data-transition':'slide','text':linkTitle, 'data-levelindex':levelIndex}) ) );
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
                var oneList = getOneLevelListMarkup( index, linkTitle );
                $('#s-skyldleikur div[data-role="content"]').append( oneList );
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
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: '/ie/ib_app/login',
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

    $('ul.levelentry a').live('click', function(event){
        einnSkyldleikur.startLevel( $(this).data('levelindex') );
    });
    
    
    // REST þjónusta í ekki-utf-8 ftw!
    $.ajaxSetup({
        contentType: "text/plain; charset=iso-8859-1",
        beforeSend: function(jqXHR) {
            jqXHR.overrideMimeType("text/plain;charset=iso-8859-1");
        }
    });

    
/*
    // stillum af leikinn þegar forsíðan en endurhlaðin
    $( document ).delegate("#s-skyldleikur", "pageinit", function() {
        initializeSkyldleikurinn();
    });
*/
    
});
//})();