let audios =["Donau/2001.mp3","Donau/1990.mp3","Donau/1999.mp3","Donau/2011.mp3","Donau/1980.mp3","Donau/1979.mp3","Donau/1995.mp3","Donau/1998.mp3","Donau/2007.mp3","Donau/1991.mp3","Donau/1994.mp3","Donau/2009.mp3","Donau/2005.mp3","Donau/2018.mp3","Donau/2000.mp3","Donau/1996.mp3","Donau/2004.mp3","Donau/2002.mp3","Donau/1997.mp3","Donau/1988.mp3","Donau/Compilation-1980-83.mp3","Donau/1993.mp3","Donau/1987.mp3"]
let wavesurfers = [];
let markers = [];
let alignmentGrids = {};
let ref;
let currentAudioIx= 0;
let storage;
try { 
  storage = window.localStorage;
} catch(err) { 
  console.warn("Unable to access local storage: ", err);
}


function seekToLastMark() { 
  if(markers.length) { 
    const currentAlignmentIx = getClosestAlignmentIx();
    const prevMarkers = markers.filter(m => m <= currentAlignmentIx);
    let lastMarker;
    if(prevMarkers.length) 
      lastMarker = prevMarkers[prevMarkers.length-1]
    else
      lastMarker = 0;
    wavesurfers[currentAudioIx].seekTo(
      getCorrespondingTime(currentAudioIx, lastMarker) / 
      wavesurfers[currentAudioIx].getDuration()
    )
  }
}

function getClosestAlignmentIx(time = wavesurfers[currentAudioIx].getCurrentTime()) { 
  // return alignment index closest to supplied time (default: current playback position)
  let currentGrid = alignmentGrids[audios[currentAudioIx]]
  // find the nearest marker to current playback time
  const lower = currentGrid.filter(t => t <= time);
  // ix for closest marker below current time
  let closestAlignmentIx = lower.length;
  // if next marker (closest above current time) is closer, switch to it
  if(closestAlignmentIx < currentGrid.length && 
     time - currentGrid[closestAlignmentIx] > 
      currentGrid[closestAlignmentIx+1])  
          closestAlignmentIx += 1;
  return closestAlignmentIx;
}

function getCorrespondingTime(audioIx, alignmentIx) { 
  // get time position corresponding to current position of current audio, 
  // in the alternative audio with index audioIx
  let grid = alignmentGrids[audios[audioIx]];
  console.log("Looking up ", alignmentIx, " in ", grid);
  return grid[alignmentIx];
}

function onClickRenditionName(e) { 
  document.getElementById(`waveform${currentAudioIx}`).classList.remove("active");
  console.log("Clicked: ", e.target.innerText);
  console.log("ref is: ", ref);
  console.log("Pausing current: ", currentAudioIx);
  console.log("Current duration: ", wavesurfers[currentAudioIx].getDuration());
  const wasPlaying = wavesurfers[currentAudioIx].isPlaying();
  wavesurfers[currentAudioIx].pause();
  let closestAlignmentIx = getClosestAlignmentIx();
  // swap to new audio and alignment grid
  currentAudioIx = audios.indexOf(e.target.innerText);
  console.log("new audio ix: ", currentAudioIx);
  let currentGrid = alignmentGrids[audios[currentAudioIx]]
  console.log("new audio grid: ", alignmentGrids[audios[currentAudioIx]]);
  console.log("new duration: ", wavesurfers[currentAudioIx].getDuration());
  document.getElementById(`waveform${currentAudioIx}`).classList.add("active");
  // seek to new (corresponding) position 
  transitionToLastMark = document.getElementById(`transitionType`).checked;
  console.log("transitionToLastMark: ", transitionToLastMark)
  let correspondingPosition = currentGrid[closestAlignmentIx];
  let newPosition = correspondingPosition / wavesurfers[currentAudioIx].getDuration();
  wavesurfers[currentAudioIx].seekTo(newPosition);
  if(transitionToLastMark) { 
    seekToLastMark();
  }   
  if(wasPlaying)
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
      r.addEventListener("click", onClickRenditionName);
    });
}
document.addEventListener('DOMContentLoaded', () => {
  // generate waveforms
  audios.forEach((t, ix) => { 
    let waveform = document.createElement("div");
    waveform.setAttribute("id", "waveform"+ix);
    waveform.classList.add("waveform");
    waveform.dataset.ix = ix;
    document.getElementById("waveforms").appendChild(waveform);
    let wavesurfer = WaveSurfer.create({
      container: `#waveform${ix}`,
      waveColor: "violet",
      progressColor: "purple",
      //backend: "MediaElement"
      plugins: [ WaveSurfer.markers.create({}) ]
    });
    wavesurfer.load(root + "wav/" + audios[ix]);
    wavesurfer.on("marker-click", (e) => {
      // index into audio recordings for clicked marker's waveform
      const clickedAudioIx = e.el.closest(".waveform").dataset.ix;
      // get corresponding wavesurfer object
      const clickedSurfer = wavesurfers[clickedAudioIx];
      // look up alignment grid for this audio recording
      const clickedGrid = alignmentGrids[audios[clickedAudioIx]];
      // find the index of the time-value corresponding to the clicked marker in this grid
      const alignmentIx = clickedGrid.indexOf(e.time);
      if(alignmentIx > -1) { 
        // delete the markers corresponding to this alignment index
        markers.splice(markers.indexOf(alignmentIx), 1);
        // update markers in storage, if possible
        if(storage) {
          storage.setItem("markers", JSON.stringify(markers));
        }
        // redraw (remaining) markers for all waveforms
        wavesurfers.forEach((ws, wsIx) => {
          ws.clearMarkers();
          markers.forEach(m => {
            // get time corresponding to the marker for this audio
            const t = getCorrespondingTime(wsIx, m);
            // draw marker at this time
            ws.addMarker({time: t, color:"green"});
          })
        })
      } else { 
        console.error("Could not find grid entry for time ", e.time);
      }
    });
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
  // play/pause button
  document.getElementById("playpause").addEventListener('click', function(e){
    if(wavesurfers[currentAudioIx].isPlaying()) 
      wavesurfers[currentAudioIx].pause();
    else 
      wavesurfers[currentAudioIx].play();
  });
  // mark button
  document.getElementById("mark").addEventListener('click', function(e){
    let toMark = getClosestAlignmentIx();
    markers.push(toMark);
    // update markers in storage, if possible
    if(storage) {
      storage.setItem("markers", JSON.stringify(markers));
    }
    wavesurfers.forEach((ws, wsIx) =>  {
      const t = getCorrespondingTime(wsIx, toMark);
      console.log("got corresponding time: ",t) 
      ws.addMarker({time: t, color:"green"})
    })
  });
  // restore button
  document.getElementById("restore").addEventListener('click', function(e){
    // recover marker positions from local storage if possible
    if(storage) { 
      markersString = storage.getItem("markers");
      if(markersString) {
        markers = JSON.parse(markersString);
        wavesurfers.forEach((ws, wsIx) => {
          // apply any markers that may have been loaded from local storage
          markers.forEach(m => { 
            const t = getCorrespondingTime(wsIx, m);
            wavesurfers[wsIx].addMarker({time: t, color:"green"});
          })
        })
      }
    }
  });
  // play from last marker button
  document.getElementById("playLastMark").addEventListener('click', () => seekToLastMark());
})
