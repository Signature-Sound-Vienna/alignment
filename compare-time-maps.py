# Python tool to compare two Verovio time maps
# Take as input two time maps in JSON format and compare them:
# - filter each timemap array to keep only entries with "on" key
# - compare the "qstamp" values of the two time maps
# - output the differences
# Usage: python compare-time-maps.py time-map1.json time-map2.json
# Output: JSON object with the differences between the two time maps

import sys
import json

def compare_time_maps(time_map1, time_map2):
    # Filter the time maps to keep only entries with "on" key
    time_map1_filtered = [entry for entry in time_map1 if "on" in entry]
    time_map2_filtered = [entry for entry in time_map2 if "on" in entry]

    # Compare the "qstamp" values of the two time maps
    # Output only the qstamp values that exist in one time map but not in the other
    differences = [
    ]
    for entry in time_map1_filtered:
        if entry["qstamp"] not in [entry["qstamp"] for entry in time_map2_filtered]:
            differences.append({ entry["qstamp"]: "only_in_1" })
    for entry in time_map2_filtered:
        if entry["qstamp"] not in [entry["qstamp"] for entry in time_map1_filtered]:
            differences.append({ entry["qstamp"]: "only_in_2" })

    # order the differences by qstamp
    differences.sort(key=lambda x: list(x.keys())[0])
    return differences


def main(): 
    # Check the number of arguments
    if len(sys.argv) != 3:
        print("Usage: python compare-time-maps.py time-map1.json time-map2.json")
        sys.exit(
            "Error: wrong number of arguments"
        )
    # Read the time maps from the input files
    with open(sys.argv[1], "r") as file1:
        time_map1 = json.load(file1)
    with open(sys.argv[2], "r") as file2:
        time_map2 = json.load(file2)

    # Compare the two time maps
    differences = compare_time_maps(time_map1, time_map2)

    # Output the differences
    print(json.dumps(differences, indent=2))

if __name__ == "__main__":
    main()
