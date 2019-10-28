/**
 * jspsych-free-sort
 * plugin for drag-and-drop sorting of a collection of images
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 */


jsPsych.plugins['free-sort'] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('free-sort', 'stimuli', 'image');

  plugin.info = {
    name: 'free-sort',
    description: '',
    parameters: {
      stimuli: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Stimuli',
        default: undefined,
        array: true,
        description: 'Images to be displayed.'
      },
      stim_x_location: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus x location',
        default: undefined,
        array: true,
        description: 'x location of images in pixels.'
      },
      stim_y_location: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus y location',
        default: undefined,
        array: true,
        description: 'y location of images in pixels.'
      },
      stim_height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus height',
        default: undefined,
        array: true,
        description: 'Height of images in pixels.'
      },
      stim_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus width',
        default: undefined,
        array: true,
        description: 'Width of images in pixels'
      },
      sort_area_height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Sort area height',
        default: 637.5,
        description: 'The height of the container that subjects can move the stimuli in.'
      },
      sort_area_width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Sort area width',
        default: 850,
        description: 'The width of the container that subjects can move the stimuli in.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'It can be used to provide a reminder about the action the subject is supposed to take.'
      },
      prompt_location: {
        type: jsPsych.plugins.parameterType.SELECT,
        pretty_name: 'Prompt location',
        options: ['above','below'],
        default: 'above',
        description: 'Indicates whether to show prompt "above" or "below" the sorting area.'
      },
      button_label: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button label',
        default:  'Continue',
        description: 'The text that appears on the button to continue to the next trial.'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    var start_time = performance.now();

    var html = "";
    // check if there is a prompt and if it is shown above
    if (trial.prompt !== null && trial.prompt_location == "above") {
      html += trial.prompt;
    }

    html += '<div '+
      'id="jspsych-free-sort-arena" '+
      'class="jspsych-free-sort-arena" '+
      'style="position: relative; width:'+trial.sort_area_width+'px; height:'+trial.sort_area_height+'px; border:2px solid #444;"'+
      '></div>';

    // check if prompt exists and if it is shown below
    if (trial.prompt !== null && trial.prompt_location === "below") {
      html += trial.prompt;
    }

    display_element.innerHTML = html;
    display_element.querySelector("#jspsych-free-sort-arena").innerHTML += '<div ' +
        'id="free-sort-static-arena" ' +
        'class="free-sort-static-arena" '+
        'style="position: relative; width:'+ 850 +'px; height:'+ 400 +'px; border:0px solid #ffffff;"'+
        '></div>';

    display_element.querySelector("#jspsych-free-sort-arena").innerHTML += '<div ' +
        'id="free-sort-dynamic-arena" ' +
        'class="free-sort-dynamic-arena" '+
        'style="position: relative; width:'+ 850 +'px; height:'+ 237.5 +'px; border:0px solid #ffffff;"'+
        '></div>';

    // store initial location data
    var init_locations = [];

    for (var i = 0; i < trial.stimuli.length; i++) {
      // var coords = get_coordinate(trial.sort_area_width - trial.stim_width[i], trial.sort_area_height - trial.stim_height[i], i);
      var coords = {
        x: trial.stim_x_location[i],
        y: trial.stim_y_location[i]
      };
      var class_name = i === 0 ? "jspsych-free-sort-draggable" : "jspsych-free-sort-not-draggable";
      var arena_name = i === 0 ? "#free-sort-dynamic-arena" : "#free-sort-static-arena";

      display_element.querySelector(arena_name).innerHTML += '<img '+
        'src="'+trial.stimuli[i]+'" '+
        'id="'+ i +'" '+
        'data-src="'+trial.stimuli[i]+'" '+
        'class='+ class_name +' '+
        'draggable="false" '+
        'style="position: absolute; cursor: move;' +
          'max-width: 95%; object-fit: cover;' +
          ' top:'+coords.y+'px; left:'+coords.x+'px;">'+
        '</img>';

      init_locations.push({
        "src": trial.stimuli[i],
        "x": coords.x,
        "y": coords.y
      });
    }

    display_element.innerHTML += '<button id="jspsych-free-sort-done-btn" class="jspsych-btn">'+trial.button_label+'</button>';

    var maxz = 1;

    var moves = [];

    var draggables = display_element.querySelectorAll('.jspsych-free-sort-draggable');
    // TODO: Change to JqueryUI draggable
    // console.log("draggables.length: "+draggables.length);

    for(var i=0;i<draggables.length; i++){
      draggables[i].addEventListener('mousedown', function(event){
          // console.log("Mouse Down");

        var x = event.pageX - event.currentTarget.offsetLeft;
        var y = event.pageY - event.currentTarget.offsetTop - window.scrollY;
        var elem = event.currentTarget;
        elem.style.zIndex = ++maxz;

        var mousemoveevent = function(e){
          elem.style.top =  Math.min(trial.sort_area_height - trial.stim_height[elem.id], Math.max(0,(e.clientY - y))) + 'px';
          elem.style.left = Math.min(trial.sort_area_width  - trial.stim_width[elem.id],  Math.max(0,(e.clientX - x))) + 'px';
        };
        document.addEventListener('mousemove', mousemoveevent);

        var mouseupevent = function(e){
            // console.log("Mouse Up");
          document.removeEventListener('mousemove', mousemoveevent);
          // console.log(elem.id);
          moves.push({
            "src": elem.dataset.src,
            "x": elem.offsetLeft,
            "y": elem.offsetTop
          });
          document.removeEventListener('mouseup', mouseupevent);
        };
        document.addEventListener('mouseup', mouseupevent);
      });
    }

    display_element.querySelector('#jspsych-free-sort-done-btn').addEventListener('click', function(){

      var end_time = performance.now();
      var rt = end_time - start_time;
      // gather data
      // get final position of all objects
      var final_locations = [];
      var matches = display_element.querySelectorAll('.jspsych-free-sort-draggable');
      for(var i=0; i<matches.length; i++){
        final_locations.push({
          "src": matches[i].dataset.src,
          "x": parseInt(matches[i].style.left),
          "y": parseInt(matches[i].style.top)
        });
      }

      var trial_data = {
        "init_locations": JSON.stringify(init_locations),
        "moves": JSON.stringify(moves),
        "final_locations": JSON.stringify(final_locations),
        "rt": rt
      };

      // advance to next part
      display_element.innerHTML = '';
      jsPsych.finishTrial(trial_data);
    });

  };

  // helper functions

  // function get_coordinate(max_width, max_height, index) {
  //   // var rnd_x = Math.floor(Math.random() * (max_width - 1));
  //   // var rnd_y = Math.floor(Math.random() * (max_height - 1));
  //   var rnd_x = trial.stim_x_location[index];
  //   var rnd_y = trial.stim_y_location[index];
  //
  //   return {
  //     x: rnd_x,
  //     y: rnd_y
  //   };
  // }

  return plugin;
})();
