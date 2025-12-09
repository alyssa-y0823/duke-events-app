const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const fetchDukeEvents = async (futureDays = 30) => {
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

    // parse dates
    let startTimestamp = null;
    let endTimestamp = null;

    if (ev.start?.utcdate) {
      const dateStr = ev.start.utcdate;
      const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(9, 11)}:${dateStr.slice(11, 13)}:${dateStr.slice(13, 15)}Z`;
      const startDate = new Date(formatted);

      if (!isNaN(startDate.getTime())) {
        startTimestamp = Math.floor(startDate.getTime() / 1000);
      }
    }

    if (ev.end?.utcdate) {
      const endDateStr = ev.end.utcdate;
      const formattedEnd = `${endDateStr.slice(0, 4)}-${endDateStr.slice(4, 6)}-${endDateStr.slice(6, 8)}T${endDateStr.slice(9, 11)}:${endDateStr.slice(11, 13)}:${endDateStr.slice(13, 15)}Z`;
      const endDate = new Date(formattedEnd);

      if (!isNaN(endDate.getTime())) {
        endTimestamp = Math.floor(endDate.getTime() / 1000);
      }
    }

    return {
      id: ev.id || ev.guid || `json-${index}-${Date.now()}`,
      title: ev.summary || '',
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
      tags: ev.categories?.category?.map(cat => cat.value) || [],
      categories: ev.categories?.category?.map(cat => cat.value) || [],
      link: ev.link || '',
      event_url: ev.link || '',
      image: ev.xproperties?.X_BEDEWORK_IMAGE?.values?.text || '',
    };
  });

  const validEvents = parsedEvents.filter(e => e.start_timestamp);
  console.log(`✅ Successfully parsed ${validEvents.length} events with valid dates`);
  return validEvents;
};

exports.getDukeEvents = async (req, res) => {
  try {
    const futureDays = req.query.future_days || 30;
    const events = await fetchDukeEvents(futureDays);
    res.json(events);
  } catch (error) {
    console.error('❌ Error fetching Duke events:', error);
    res.status(500).json({
      error: 'Failed to fetch Duke events',
      message: error.message
    });
  }
};

exports.rankEvents = async (req, res) => {
  try {
    const { user_profile, weights } = req.body;
    const futureDays = req.query.future_days || 30;

    const events = await fetchDukeEvents(futureDays);

    try {
      const rankingResponse = await fetch('http://localhost:5001/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_profile,
          events,
          weights
        })
      });

      if (!rankingResponse.ok) {
        throw new Error(`Ranking service error: ${rankingResponse.status}`);
      }

      const rankedEvents = await rankingResponse.json();

      const rankedMap = new Map(rankedEvents.map(r => [String(r.id), r]));

      const mergedEvents = events.map(ev => {
        const rankInfo = rankedMap.get(String(ev.id));
        if (rankInfo) {
          return {
            ...ev,
            relevanceScore: rankInfo.score,
            scoreDetails: rankInfo.details
          };
        }
        return { ...ev, relevanceScore: 0 };
      });

      mergedEvents.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      res.json(mergedEvents);

    } catch (rankError) {
      console.error('⚠️ Ranking service unavailable, falling back to standard sort:', rankError.message);
      res.json(events);
    }

  } catch (error) {
    console.error('❌ Error in rankEvents:', error);
    res.status(500).json({
      error: 'Failed to rank events',
      message: error.message
    });
  }
};

exports.getMajors = async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../../../data/majors.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const majorsData = JSON.parse(rawData);

    let majorList = [];

    for (const schoolKey in majorsData) {
      const school = majorsData[schoolKey];
      const programList = school.programs || [];

      programList.forEach(prog => {
        if (prog.major) {
          majorList.push(prog.major);
        }
      });
    }

    majorList.sort();

    if (!majorList.includes('Other')) {
      majorList.push('Other');
    }

    res.json(majorList);
  } catch (error) {
    console.error('❌ Error fetching majors:', error);
    res.status(500).json({ error: 'Failed to fetch majors' });
  }
};