"""End-to-end test — logs full message structure to identify audio events."""
import asyncio
import websockets
import json
import base64
import struct


def generate_silence(samples=4096):
    silence = struct.pack(f'<{samples}h', *([0] * samples))
    return base64.b64encode(silence).decode()


async def test():
    uri = 'ws://127.0.0.1:8080/ws/user6/sess6?persona=paul_graham'
    async with websockets.connect(uri, close_timeout=5, ping_interval=None) as ws:
        print('1. Connected')

        stop_audio = asyncio.Event()

        async def send_audio():
            while not stop_audio.is_set():
                try:
                    silence = generate_silence()
                    await ws.send(json.dumps({
                        'type': 'audio', 'data': silence, 'sampleRate': 16000
                    }))
                    await asyncio.sleep(0.25)
                except Exception:
                    break

        audio_task = asyncio.create_task(send_audio())
        print('2. Streaming audio...')

        # Collect ALL messages and analyze structure
        for i in range(40):
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=5)
                msg = json.loads(response)

                # Print condensed structure of each message
                keys = sorted(msg.keys())
                summary = f'  MSG {i+1}: keys={keys}'

                # Check all possible audio locations
                raw = response
                if 'inlineData' in raw:
                    summary += ' ** HAS INLINE DATA **'
                if 'audio' in raw.lower():
                    # Find where audio appears
                    for k in keys:
                        v = str(msg[k])
                        if 'audio' in v.lower() or 'inline' in v.lower():
                            summary += f' [audio in {k}]'

                # Check for content/parts
                if 'content' in msg:
                    parts = msg['content'].get('parts', [])
                    for p in parts:
                        pk = list(p.keys())
                        summary += f' content.parts={pk}'
                        if 'inlineData' in p:
                            summary += ' ** AUDIO PART **'

                if 'serverContent' in msg:
                    sc = msg['serverContent']
                    if 'modelTurn' in sc:
                        parts = sc['modelTurn'].get('parts', [])
                        for p in parts:
                            pk = list(p.keys())
                            summary += f' serverContent.modelTurn.parts={pk}'

                # Check for partial transcript
                if 'partial' in msg:
                    summary += f' partial={str(msg["partial"])[:80]}'

                if 'outputTranscription' in msg:
                    ot = msg['outputTranscription']
                    if isinstance(ot, dict) and ot.get('text'):
                        summary += f' TRANSCRIPT="{ot["text"][:100]}"'

                # Print first 300 chars for first 5 messages
                if i < 5:
                    print(summary)
                    print(f'    RAW: {response[:300]}')
                else:
                    print(summary)

            except asyncio.TimeoutError:
                print(f'  Timeout after {i} messages')
                break

        # Send PITCH_COMPLETE
        print('\n3. Sending PITCH_COMPLETE...')
        await ws.send(json.dumps({
            'type': 'text',
            'text': 'PITCH_COMPLETE. Founder pitched WoofWalk dog walking app. 100B TAM claim, no users, wants 500K. Give feedback now.'
        }))

        for i in range(50):
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=8)
                msg = json.loads(response)
                keys = sorted(msg.keys())
                summary = f'  RESP {i+1}: keys={keys}'

                if 'inlineData' in response:
                    summary += ' ** HAS AUDIO **'

                if 'content' in msg:
                    parts = msg['content'].get('parts', [])
                    for p in parts:
                        if 'inlineData' in p:
                            summary += ' ** AUDIO IN CONTENT **'
                        if 'text' in p:
                            summary += f' text="{p["text"][:100]}"'

                if 'serverContent' in msg:
                    sc = msg['serverContent']
                    if 'modelTurn' in sc:
                        parts = sc['modelTurn'].get('parts', [])
                        for p in parts:
                            if 'inlineData' in p:
                                summary += ' ** ADVISOR AUDIO **'

                if i < 10:
                    print(summary)
                    if 'inlineData' in response:
                        print(f'    RAW (first 200): {response[:200]}')

            except asyncio.TimeoutError:
                print(f'  Timeout after {i} responses')
                break

        stop_audio.set()
        audio_task.cancel()
        print('\nDone.')

asyncio.run(test())
