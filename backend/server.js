// server-json.js - JSON version
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/events', async (req, res) => {
  try {
    const futureDays = req.query.future_days || 30;
    
    // Use JSON endpoint
    const response = await fetch(`https://calendar.duke.edu/events/index.json?future_days=${futureDays}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Duke JSON API returned', data.events?.length || 0, 'events');
    
    const events = data.events || [];
    
    const parsedEvents = events.map((item, index) => {
      const ev = item.event;
      
      // Parse the UTC date properly from JSON format
      let startTimestamp = null;
      let endTimestamp = null;
      
      if (ev.start?.utcdate) {
        // The format is "20250902T040000Z" - need to insert hyphens and colons
        const dateStr = ev.start.utcdate;
        const formattedDate = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}T${dateStr.slice(9,11)}:${dateStr.slice(11,13)}:${dateStr.slice(13,15)}Z`;
        const startDate = new Date(formattedDate);
        
        console.log(`Converting "${dateStr}" to "${formattedDate}" -> ${startDate}`);
        
        if (!isNaN(startDate.getTime())) {
            startTimestamp = Math.floor(startDate.getTime() / 1000);
        }
        }
      
        if (ev.end?.utcdate) {
        const endDateStr = ev.end.utcdate;
        const formattedEndDate = `${endDateStr.slice(0,4)}-${endDateStr.slice(4,6)}-${endDateStr.slice(6,8)}T${endDateStr.slice(9,11)}:${endDateStr.slice(11,13)}:${endDateStr.slice(13,15)}Z`;
        const endDate = new Date(formattedEndDate);
        
        console.log(`Converting end: "${endDateStr}" to "${formattedEndDate}" -> ${endDate}`);
        
        if (!isNaN(endDate.getTime())) {
            endTimestamp = Math.floor(endDate.getTime() / 1000);
        }
        }
      
      // Debug first few events
      if (index < 3) {
        console.log(`JSON Event ${index}:`, {
          title: ev.summary,
          startDate: ev.start?.utcdate,
          parsedStart: startTimestamp ? new Date(startTimestamp * 1000) : 'Invalid'
        });
      }
      
      
      return {
        // id: ev.id || ev.guid || `event-${index}`,
        id: ev.id || ev.guid || `json-${index}-${Date.now()}`, 
        summary: ev.summary || '',
        description: ev.description || '',
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
        sponsor: ev.xproperties?.X_BEDEWORK_CS?.values?.text || 'Duke University',
        location: {
          address: ev.location?.address || '',
          link: ev.location?.link || '',
        },
        contact: {
          name: ev.contact?.name || '',
          email: ev.contact?.email || '',
        },
        categories: ev.categories?.category?.map(cat => cat.value) || [],
        link: ev.link || '',
        event_url: ev.link || '',
        image: ev.xproperties?.X_BEDEWORK_IMAGE?.values?.text || '',
      };
    });
    
    const validEvents = parsedEvents.filter(e => e.start_timestamp);
    console.log(`Parsed ${validEvents.length} events with valid dates out of ${parsedEvents.length} total`);
    
    res.json(parsedEvents);
    
  } catch (error) {
    console.error('JSON Fetch Error:', error);
    res.status(500).json({ error: 'Error fetching JSON data: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`JSON Backend running on http://localhost:${PORT}`);
});