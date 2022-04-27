const wsContainers = ["waveform1", "waveform2"];
let wavesurfers = [];
let markers = [];
let audios = [];
let alignmentGrids = {};
let ref;
let currentAudioIx= 0;

function onClickRenditionName(e) { 
  document.getElementById(`wavesurfer${currentAudioIx}`).classList.remove("active");
  console.log("Clicked: ", e.target.innerText);
  console.log("ref is: ", ref);
  console.log("Pausing current: ", currentAudioIx);
  console.log("Current duration: ", wavesurfers[currentAudioIx].getDuration());
  const wasPlaying = wavesurfers[currentAudioIx].isPlaying();
  wavesurfers[currentAudioIx].pause();
  const currentTime = wavesurfers[currentAudioIx].getCurrentTime();
  let currentGrid = alignmentGrids[audios[currentAudioIx]]
  // find the nearest marker to current playback time
  const lower = currentGrid.filter(t => t <= currentTime);
  // ix for closest marker below current time
  let closestAlignmentIx = lower.length;
  // if next marker (closest above current time) is closer, switch to it
  if(closestAlignmentIx < currentGrid.length && 
     currentTime - currentGrid[closestAlignmentIx] > 
      currentGrid[closestAlignmentIx+1])  
          closestAlignmentIx += 1;
  // swap to new audio and alignment grid
  currentAudioIx = audios.indexOf(e.target.innerText);
  console.log("new audio ix: ", currentAudioIx);
  currentGrid = alignmentGrids[audios[currentAudioIx]]
  console.log("new audio grid: ", alignmentGrids[audios[currentAudioIx]]);
  console.log("new duration: ", wavesurfers[currentAudioIx].getDuration());
  document.getElementById(`wavesurfer${currentAudioIx}`).classList.add("active");
  // seek to new (corresponding) position 
  let correspondingPosition = currentGrid[closestAlignmentIx];
  let newPosition = correspondingPosition / wavesurfers[currentAudioIx].getDuration();
  console.log("new position: ", correspondingPosition, wavesurfers[currentAudioIx].getDuration(), newPosition);
  wavesurfers[currentAudioIx].seekTo(newPosition);
  if(wasPlaying)
    wavesurfers[currentAudioIx].play();
}

function setGrids(grids) { 
  const ws = document.getElementById("waveforms");
  wavesurfers = [];
  audios = [];
  ws.innerHTML = "";
  console.log("setting grids: ", grids);
  alignmentGrids = grids;
  audios = Object.keys(alignmentGrids).sort();
  document.getElementById("audios").innerHTML = "<ul>" + 
    audios
    .map(k => "<li class='renditionName'>"+k+"</li>")
    .join("") + "</ul>";
  Array.from(document.getElementsByClassName("renditionName"))
    .forEach((r, ix) => {
      console.log("loop: ", r, ix);
      r.addEventListener("click", onClickRenditionName);
      ws.innerHTML += `<div id="wavesurfer${ix}" class="waveform"></div>`;
      console.log("Exists: ", document.getElementById(`wavesurfer${ix}`))
      let wavesurfer = WaveSurfer.create({
        container: `#wavesurfer${ix}`,
        waveColor: "violet",
        progressColor: "purple",
        backend: "MediaElement",
        plugins: [ WaveSurfer.markers.create({}) ]
      });
      wavesurfer.load(root + "wav/" + audios[ix]);
      wavesurfer.on('waveform-ready', () => {
        console.log("Wavesurfer waveform ", ix, "ready!");
      })
      wavesurfers.push(wavesurfer);
      wavesurfer.once('redraw', () => { debugger; });

    });
}

document.addEventListener('DOMContentLoaded', () => {
  // initialise wavesurfer containers
  //
 /*
  wsContainers.forEach( (ws, ix) => {
     wavesurfers.push(WaveSurfer.create({
        container: `#${ws}`,
        waveColor: "violet",
        progressColor: "purple",
        plugins: [ WaveSurfer.markers.create({}) ]
     }))
   });
*/
  // hook up event listeners
  document.getElementById("csv").addEventListener("change", (e) => { 
    const file = e.target.files[0];
    if(!file) { 
      console.warn("Not a CSV file: ", file);
      return;
    } 
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target.result;
      const grids = {};
      lines = contents.split("\n");
      audiofiles = lines[0].split("|");
      ref = audiofiles[0];
      audiofiles.forEach((name, ix) => { 
        grids[audiofiles[ix]] = lines[ix+1].split(",");
      })
      setGrids(grids);
    };
    reader.readAsText(file);
  });

  document.getElementById("playpause").addEventListener('click', function(e){
    if(wavesurfers[currentAudioIx].isPlaying()) 
      wavesurfers[currentAudioIx].pause();
    else 
      wavesurfers[currentAudioIx].play();
  })
})

