from groq import AsyncGroq
from dotenv import load_dotenv
import time
import csv
import asyncio
import os
from datetime import datetime
load_dotenv()

client = AsyncGroq()
SYSTEM_PROMPT = """
You are a 911 switch operator receiving calls immediately after a large-scale disaster event. Resources are severely limited and you must prioritize which calls need immediate response versus those that can wait.

Your ONLY task is to assess the criticality level of each call and respond with EXACTLY ONE WORD: LOW, MEDIUM, HIGH, or CRITICAL

Classification criteria:

CRITICAL - Immediate life-threatening emergency requiring instant response:
  • Confirmed active fire with people trapped
  • Building collapse with victims underneath
  • People not breathing, unconscious, or severe bleeding
  • Imminent explosions or hazardous material exposure
  • Multiple casualties confirmed

HIGH - Urgent and potentially life-threatening, needs rapid attention:
  • Spreading fires approaching occupied structures
  • Serious injuries with active bleeding
  • Downed power lines near people
  • Structural damage with potential collapse risk

MEDIUM - Distressing situation but no immediate confirmed danger:
  • Smell of smoke without visible fire
  • Welfare checks on missing neighbors
  • People trapped but currently safe
  • Uncertain threats or unconfirmed hazards

LOW - Minor issues, information requests, can wait:
  • Questions about evacuation centers or safe zones
  • General safety inquiries without specific threat
  • Property damage without immediate danger
  • Resource location requests (water, supplies)

When in doubt between two levels, consider: Is there confirmed immediate danger to life? If yes, escalate. If uncertain, choose the lower level.

Output ONLY the classification level, nothing else.
"""

async def get_criticality_level(call_transcript: str) -> str:
    """
    Assess the criticality level of a 911 call transcript.

    Args:
        call_transcript: The text of the emergency call

    Returns:
        The criticality level: LOW, MEDIUM, HIGH, or CRITICAL
    """
    chat_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": call_transcript,
            }
        ],
        model="openai/gpt-oss-20b",
        temperature=0.5,
        top_p=1,
        stream=False,
    )
    content = chat_completion.choices[0].message.content
    if content is None:
        return "ERROR: No content returned"
    return content.strip()

# Local test suite for sentiment analysis
async def run_tests():
    test_cases = [
        # CRITICAL cases - immediate life-threatening emergencies
        {
            "message": "My house is on fire and my family is trapped inside!",
            "expected": "CRITICAL",
            "description": "Active fire with people trapped"
        },
        {
            "message": "Someone is having a heart attack, they're not breathing!",
            "expected": "CRITICAL",
            "description": "Medical emergency - cardiac arrest"
        },
        {
            "message": "Building collapsed with people underneath the rubble, I can hear screaming",
            "expected": "CRITICAL",
            "description": "Structural collapse with confirmed victims"
        },
        {
            "message": "Gas leak and I smell smoke, I'm scared my house is going to explode",
            "expected": "CRITICAL",
            "description": "Imminent explosion danger"
        },

        # HIGH cases - urgent, potentially life-threatening
        {
            "message": "My elderly mother fell and can't get up, she's bleeding from her head",
            "expected": "HIGH",
            "description": "Serious injury requiring rapid attention"
        },
        {
            "message": "There's a fire spreading in my neighborhood, getting close to houses",
            "expected": "HIGH",
            "description": "Spreading fire threat"
        },
        {
            "message": "Power lines are down and sparking near a group of people",
            "expected": "HIGH",
            "description": "Active electrical hazard with people at risk"
        },

        # MEDIUM cases - distress but no immediate danger
        {
            "message": "I smell smoke but I can't see any fire, should I evacuate?",
            "expected": "MEDIUM",
            "description": "Potential fire threat, uncertain"
        },
        {
            "message": "My neighbor's house looks damaged, I haven't seen them in hours",
            "expected": "MEDIUM",
            "description": "Welfare check needed but no confirmed emergency"
        },
        {
            "message": "We heard a loud crash and the building shook, what was that?",
            "expected": "MEDIUM",
            "description": "Uncertain situation causing distress"
        },
        {
            "message": "There's broken glass everywhere and we're stuck inside, but we're okay",
            "expected": "MEDIUM",
            "description": "Trapped but currently safe"
        },

        # LOW cases - minor issues that can wait
        {
            "message": "Where is the nearest evacuation center?",
            "expected": "LOW",
            "description": "Information request about evacuation"
        },
        {
            "message": "Is it safe to go outside? I heard there was a fire somewhere",
            "expected": "LOW",
            "description": "General safety inquiry, no immediate threat"
        },
        {
            "message": "My roof is damaged and I'm worried about rain, when can someone come?",
            "expected": "LOW",
            "description": "Property damage, non-urgent"
        },
        {
            "message": "Where do I go to get water and supplies?",
            "expected": "LOW",
            "description": "Resource location request"
        }
    ]

    print("Running 911 Call Triage Test Suite (Concurrent)")
    print("=" * 60)
    print(f"Running {len(test_cases)} tests in parallel...\n")

    # Helper function to run a single test with timing
    async def run_single_test(test, test_number):
        try:
            start_time = time.time()
            result = await get_criticality_level(test['message'])
            elapsed_time = time.time() - start_time

            test_passed = test['expected'] in result.upper()

            return {
                'test_number': test_number,
                'description': test['description'],
                'message': test['message'],
                'expected': test['expected'],
                'actual': result,
                'passed': 'PASS' if test_passed else 'FAIL',
                'response_time': elapsed_time
            }
        except Exception as e:
            return {
                'test_number': test_number,
                'description': test['description'],
                'message': test['message'],
                'expected': test['expected'],
                'actual': f'ERROR: {e}',
                'passed': 'ERROR',
                'response_time': None
            }

    # Run all tests concurrently
    overall_start = time.time()
    test_results = await asyncio.gather(*[
        run_single_test(test, i)
        for i, test in enumerate(test_cases, 1)
    ])  
    overall_elapsed = time.time() - overall_start

    # Process and display results
    passed = 0
    failed = 0
    response_times = []

    for result in test_results:
        print(f"\nTest {result['test_number']}/{len(test_cases)}: {result['description']}")
        print(f"Message: \"{result['message']}\"")
        print(f"Expected: {result['expected']}")
        print(f"Got: {result['actual']}")

        if result['response_time'] is not None:
            print(f"Response time: {result['response_time']:.3f}s")
            response_times.append(result['response_time'])
        else:
            print(f"Response time: N/A")

        if result['passed'] == 'PASS':
            print("✓ PASSED")
            passed += 1
        elif result['passed'] == 'ERROR':
            print("✗ ERROR")
            failed += 1
        else:
            print("✗ FAILED")
            failed += 1

    # Convert response_time to string for CSV output
    for result in test_results:
        if result['response_time'] is not None:
            result['response_time'] = f"{result['response_time']:.3f}"
        else:
            result['response_time'] = 'N/A'

    print("\n" + "=" * 60)
    print(f"Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    print(f"Success rate: {(passed/len(test_cases)*100):.1f}%")

    if response_times:
        avg_time = sum(response_times) / len(response_times)
        min_time = min(response_times)
        max_time = max(response_times)
        print(f"\nTiming Statistics:")
        print(f"  Overall wall time: {overall_elapsed:.3f}s")
        print(f"  Sum of all response times: {sum(response_times):.3f}s")
        print(f"  Average response time: {avg_time:.3f}s")
        print(f"  Minimum response time: {min_time:.3f}s")
        print(f"  Maximum response time: {max_time:.3f}s")

    # Write results to CSV file in temp folder
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = os.path.join(temp_dir, f"test_results_{timestamp}.csv")

    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['test_number', 'passed', 'description', 'message', 'expected', 'actual', 'response_time']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for result in test_results:
            writer.writerow(result)

    print(f"\n✓ Test results saved to: {csv_filename}")

    # Also create a filtered CSV with just the failures
    failures = [r for r in test_results if r['passed'] != 'PASS']
    if failures:
        failures_filename = os.path.join(temp_dir, f"test_failures_{timestamp}.csv")
        with open(failures_filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['test_number', 'passed', 'description', 'message', 'expected', 'actual', 'response_time']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for result in failures:
                writer.writerow(result)

        print(f"✓ Failed tests saved to: {failures_filename}")
    else:
        print("✓ All tests passed - no failures file created")

if __name__ == "__main__":
    asyncio.run(run_tests())
