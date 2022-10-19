import argparse, shutil 
from pathlib import Path

def retain(file, exclude):
  return file.name.find(exclude) < 0

if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument('-s', '--source', help="Top-level source directory for recursive search", required=True)
  parser.add_argument('-t', '--term', help="Search term", required=True)
  parser.add_argument('-x', '--exclude', help="Exclude term")
  parser.add_argument('-c', '--check', help="Don't copy, just produce check-list", action="store_true")
  parser.add_argument('-o', '--output', help="Output directory", required=True)
  parser.add_argument('-p', '--prefix', help="Optional prefix for output file", required=False)
  args = parser.parse_args()

  p = Path(args.source)
  files=[];
  prefix = args.prefix if args.prefix else ""

  if args.exclude:
    files = [f for f in p.glob("**/*"+args.term+"*") if retain(f, args.exclude)]
  else: 
    files = [f for f in p.glob("**/*"+args.term+"*")]

  files = list(filter(lambda f: f.suffix.endswith('.wav') or f.suffix.endswith('.mp3'), files)) # audio files only

  for f in files:
    parent = f.parent.name
    if parent.startswith("CD") or parent.startswith("DVD"):
      # for releases with more than one medium, use grandparent
      parent = f.parent.parent.name
    outpath = Path(args.output, prefix + parent + f.suffix)
    print(f)
    print(outpath)
    if not args.check:
      # we are copying...
      shutil.copy(f, outpath)
  if args.check:
      print("**********************************")
      print("NOTHING WAS COPIED, only produced output above as check-list, as requested by user via -c")
      print("**********************************")



