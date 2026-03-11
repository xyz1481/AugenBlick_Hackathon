const express = require('express');
const router = express.Router();
const { getIndicatorData, getHistoricalData } = require('../services/indicatorService');

// Define war-time critical watch categories
const WAR_ROOM_TICKERS = {
    macro: ['^VIX', '^TNX', 'DX-Y.NYB', 'GC=F'],
    energy: ['CL=F', 'BZ=F', 'NG=F', 'CCJ'],
    defense: ['ITA', 'LMT', 'RTX', 'NOC'],
    food: ['ZW=F', 'ZC=F', 'MOS', 'NTR'],
    tech: ['NVDA', 'PLTR', 'CRWD', 'CIBR']
};

router.get('/war-watch', async (req, res) => {
    try {
        const results = {};
        for (const [category, symbols] of Object.entries(WAR_ROOM_TICKERS)) {
            const data = await Promise.all(symbols.map(s => getIndicatorData(s)));
            results[category] = data.filter(d => d !== null);
        }
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch war watch data' });
    }
});

router.get('/history/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const { period } = req.query; // e.g. 1mo, 1y
    try {
        const history = await getHistoricalData(symbol, period || '1mo');
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});

// Original indices endpoint for backward compatibility
router.get('/indices', async (req, res) => {
    const symbols = ['^GSPC', '^IXIC', 'CL=F', 'GC=F', 'BTC-USD', 'EURUSD=X'];
    try {
        const results = await Promise.all(symbols.map(s => getIndicatorData(s)));
        res.json(results.filter(r => r !== null));
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
