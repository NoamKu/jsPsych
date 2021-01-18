/**
 * jspsych-free-sort
 * plugin for drag-and-drop sorting of a collection of images
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 */


jsPsych.plugins['free-sort'] = (function() {

  var plugin = {};

  plugin.info = {
    name: 'free-sort',
    description: '',
    parameters: {
      stim_path: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Stimuli path',
        default: undefined,
        description: 'Path of stimuli'
      },
      stim_id: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Stimuli ID',
        default: undefined,
        description: 'ID of stimuli'
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
    if (trial.prompt !== null && trial.prompt_location === "above") {
      html += trial.prompt;
    }

    html += '<div '+
      'id="jspsych-free-sort-arena" '+
      'class="jspsych-free-sort-arena" '+
      'style="position: relative; border:2px solid #444;"'+
      '></div>';

    // check if prompt exists and if it is shown below
    if (trial.prompt !== null && trial.prompt_location === "below") {
      html += trial.prompt;
    }

    display_element.innerHTML = html;
    var is_svg_onload_ran = false;

    let ajax = new XMLHttpRequest();
    ajax.open("GET", trial.stim_path, true);
    ajax.onload = function(e) {
      var svg_div = document.createElement("div");
      svg_div.innerHTML = ajax.responseText;
      svg_div.id = trial.stim_id;
      svg_div.className = "test-img";
      let svg_element = svg_div.children[0];
      svg_element.onload = onLoadFunc;
      let arena = display_element.querySelector("#jspsych-free-sort-arena");
      arena.appendChild(svg_div);

      // Make sure we are initializing the SVG - in case it loaded already
      if (!is_svg_onload_ran){
        svgInit(svg_element);
      }
    };
    ajax.send();

    // store initial location data
    var init_locations = [];

    display_element.innerHTML += '<button id="jspsych-free-sort-done-btn" class="jspsych-btn">'+trial.button_label+'</button>';

    var moves = [];
    var relative_moves = [];

    function onLoadFunc(evt){
      let svgDocument = evt.target;
      svgInit(svgDocument)
    }

    function svgInit(svgDocument){
      is_svg_onload_ran = true;

      var dynamic = svgDocument.getElementById("dynamic");
      let svg_child_nodes = svgDocument.children;
      for (var i = 0; i <svg_child_nodes.length; i++) {
        if (svg_child_nodes[i].id === "") { continue;}

        var bounding_rect = svg_child_nodes[i].getBoundingClientRect();

        init_locations.push({
          "src": svg_child_nodes[i].id,
          "x": bounding_rect.x,
          "y": bounding_rect.y
        });
      }

      makeDraggable(dynamic);
    }


    function makeDraggable(svg) {
      var rect = svg.getBoundingClientRect();
      svg.addEventListener('mousedown', startDrag);
      svg.addEventListener('mousemove', drag);
      svg.addEventListener('mouseup', endDrag);
      svg.addEventListener('mouseleave', endDrag);

      var selectedElement = false;

      var x = rect.x + 0.5 * rect.width;
      var y = rect.y + 0.5 * rect.height;

      function startDrag(e) {
        selectedElement = e.currentTarget;
      }

      function drag(e) {
        if (selectedElement) {
          e.preventDefault();
          let x_cor = (e.clientX - x) + 'px';
          let y_cor =  (e.clientY - y) + 'px';
          selectedElement.setAttributeNS(null, "x", x_cor);
          selectedElement.setAttributeNS(null, "y", y_cor);
          moves.push({
            "src": "dynamic",
            "x": e.clientX,
            "y": e.clientY
          });
          relative_moves.push({
            "src": "dynamic",
            "x": x_cor,
            "y": y_cor
          })
        }
      }

      function endDrag(e) {
        selectedElement = false;
      }
    }

    display_element.querySelector('#jspsych-free-sort-done-btn').addEventListener('click', function(){

      var end_time = performance.now();
      var rt = end_time - start_time;
      // gather data
      // get final position of all objects
      var final_locations = [];
      let svg_element = display_element.querySelectorAll('.test-img')[0].firstElementChild;
      let dynamic = svg_element.getElementById("dynamic");
      let rect = dynamic.getBoundingClientRect();
      final_locations.push({
        "src": dynamic.id,
        "x": rect.x,
        "y": rect.y
      });

      var trial_data = {
        "stim_id": JSON.stringify(trial.stim_id),
        "init_locations": JSON.stringify(init_locations),
        "moves": JSON.stringify(moves),
        "relative moves": JSON.stringify(relative_moves),
        "final_locations": JSON.stringify(final_locations),
        "rt": rt
      };

      // advance to next part
      display_element.innerHTML = '';
      jsPsych.finishTrial(trial_data);
    });

  };

  return plugin;
})();
