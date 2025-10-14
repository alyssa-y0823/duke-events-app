// controllers/eventController.js
const fetch = require('node-fetch');

exports.getDukeEvents = async (req, res) => {
  try {
    const futureDays = req.query.future_days || 30;
    
    console.log(`Fetching Duke events for next ${futureDays} days...`);
    
    const response = await fetch(
      `https://calendar.duke.edu/events/index.json?future_days=${futureDays}`
    );
    
    if (!response.ok) {
      throw new Error(`Duke API returned ${response.status}`);
    }
    
    const data = await response.json();
    const events = data.events || [];
    
    const parsedEvents = events.map((item, index) => {
      const ev = item.event;
      
      // Parse dates
      let startTimestamp = null;
      let endTimestamp = null;
      
      if (ev.start?.utcdate) {
        const dateStr = ev.start.utcdate;
        const formatted = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}T${dateStr.slice(9,11)}:${dateStr.slice(11,13)}:${dateStr.slice(13,15)}Z`;
        const startDate = new Date(formatted);
        
        if (!isNaN(startDate.getTime())) {
          startTimestamp = Math.floor(startDate.getTime() / 1000);
        }
      }
      
      if (ev.end?.utcdate) {
        const endDateStr = ev.end.utcdate;
        const formattedEnd = `${endDateStr.slice(0,4)}-${endDateStr.slice(4,6)}-${endDateStr.slice(6,8)}T${endDateStr.slice(9,11)}:${endDateStr.slice(11,13)}:${endDateStr.slice(13,15)}Z`;
        const endDate = new Date(formattedEnd);
        
        if (!isNaN(endDate.getTime())) {
          endTimestamp = Math.floor(endDate.getTime() / 1000);
        }
      }
      
      return {
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
    console.log(`✅ Successfully parsed ${validEvents.length} events with valid dates`);
    
    res.json(parsedEvents);
    
  } catch (error) {
    console.error('❌ Error fetching Duke events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Duke events',
      message: error.message 
    });
  }
};