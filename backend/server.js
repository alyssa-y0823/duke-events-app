const express = require('express');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
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
    const response = await fetch(`https://calendar.duke.edu/events/index.xml?&future_days=${futureDays}&feed_type=simple`);
    const xmlData = await response.text();
    
    xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
      if (err) {
        console.error('XML Parsing Error:', err);
        return res.status(500).json({ error: 'Error parsing XML data' });
      }
      
      const events = result.events.event;
      const eventsArr = Array.isArray(events) ? events : [events];
      
      const parsedEvents = eventsArr.map((ev, index) => ({
        id: ev.id || `event-${index}`,
        summary: ev.summary || '',
        description: ev.description || '',
        start_timestamp: ev.start_timestamp || '',
        end_timestamp: ev.end_timestamp || '',
        sponsor: ev.sponsor || '',
        location: {
          address: ev.location?.address || '',
          link: ev.location?.link || '',
        },
        contact: {
          name: ev.contact?.name || '',
          email: ev.contact?.email || '',
        },
        categories: ev.categories?.category || [],
        link: ev.link || '',
        event_url: ev.event_url || '',
      }));
      
      res.json(parsedEvents);
    });
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});