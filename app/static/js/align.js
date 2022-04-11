const wsContainers = ["waveform1", "waveform2"];
const wavesurfers = [];
let alignmentGrids = {};
let ref;

function onClickRenditionName(e) { 
  console.log("Clicked: ", e.target.innerText);
  console.log("ref is: ", ref);
  console.log("Loading: " + root + "/" + e.target.innerText);
  wavesurfers[1].load(root + "/wav/" + e.target.innerText);
}

function setGrids(grids) { 
  console.log("setting grids: ", grids);
  alignmentGrids = grids;
  document.getElementById("audios").innerHTML = "<ul>" + 
    Object.keys(alignmentGrids)
    .sort()
    .map(k => "<li class='renditionName'>"+k+"</li>")
    .join("") + "</ul>";
  Array.from(document.getElementsByClassName("renditionName"))
    .forEach(r =>  
      r.addEventListener("click", onClickRenditionName)
    )
}

document.addEventListener('DOMContentLoaded', () => {
  // initialise wavesurfer containers
  wsContainers.forEach( (ws, ix) => {
     wavesurfers.push(WaveSurfer.create({
        container: `#${ws}`,
        waveColor: "violet",
        progressColor: "purple",
        plugins: [ WaveSurfer.markers.create({}) ]
     }))
   });

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
})

