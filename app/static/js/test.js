let audios =["Donau/2001.mp3","Donau/1990.mp3","Donau/1999.mp3","Donau/2011.mp3","Donau/1980.mp3","Donau/1979.mp3","Donau/1995.mp3","Donau/1998.mp3","Donau/2007.mp3","Donau/1991.mp3","Donau/1994.mp3","Donau/2009.mp3","Donau/2005.mp3","Donau/2018.mp3","Donau/2000.mp3","Donau/1996.mp3","Donau/2004.mp3","Donau/2002.mp3","Donau/1997.mp3","Donau/1988.mp3","Donau/Compilation-1980-83.mp3","Donau/1993.mp3","Donau/1987.mp3"]
let wavesurfers = [];
let alignmentGrids = {};
let ref;
let currentAudioIx= 0;

function onClickRenditionName(e) { 
  document.getElementById(`waveform${currentAudioIx}`).classList.remove("active");
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
  document.getElementById(`waveform${currentAudioIx}`).classList.add("active");
  // seek to new (corresponding) position 
  let correspondingPosition = currentGrid[closestAlignmentIx];
  let newPosition = correspondingPosition / wavesurfers[currentAudioIx].getDuration();
  console.log("new position: ", correspondingPosition, wavesurfers[currentAudioIx].getDuration(), newPosition);
  wavesurfers[currentAudioIx].seekTo(newPosition);
//  if(wasPlaying)
    wavesurfers[currentAudioIx].play();
}

function setGrids(grids) { 
  console.log("setting grids: ", grids);
  alignmentGrids = grids;
  document.getElementById("audios").innerHTML = "<ul>" + 
    audios
    .map(k => "<li class='renditionName'>"+k+"</li>")
    .join("") + "</ul>";
  Array.from(document.getElementsByClassName("renditionName"))
    .forEach((r, ix) => {
      console.log("loop: ", r, ix);
      r.addEventListener("click", onClickRenditionName);
    });
}
document.addEventListener('DOMContentLoaded', () => {
  // generate waveforms
  audios.forEach((t, ix) => { 
    let waveform = document.createElement("div");
    waveform.setAttribute("id", "waveform"+ix);
    document.getElementById("waveforms").appendChild(waveform);
    let wavesurfer = WaveSurfer.create({
      container: `#waveform${ix}`,
      waveColor: "violet",
      progressColor: "purple"
      //backend: "MediaElement"
     // plugins: [ WaveSurfer.markers.create({}) ]
    });
    wavesurfer.load(root + "wav/" + audios[ix]);
    wavesurfers.push(wavesurfer);
  })  
  // hook up file event listener
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
})