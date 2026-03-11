const fs = require('fs');
const path = require('path');

// Load trade data from frontend side (since that's where the user put it)
// In a real app, this would be in a shared data folder or DB.
const TRADE_DATA_PATH = path.join(__dirname, '../../frontend/src/data/trade.json');

const getTradeData = () => {
    try {
        const raw = fs.readFileSync(TRADE_DATA_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to read trade data for simulation:', err);
        return [];
    }
};

const simulateCrisis = async (req, res) => {
    const { sideA, sideB } = req.body; // sideA: ['USA', 'UK'], sideB: ['Russia', 'China']

    if (!sideA || !sideB || !Array.isArray(sideA) || !Array.isArray(sideB)) {
        return res.status(400).json({ error: 'sideA and sideB must be arrays of country names' });
    }

    const tradeData = getTradeData();
    const consequences = {
        totalTradeCut: 0,
        disruptedGoods: {},
        volatilityScore: 0,
        globalInflationImpact: 0,
        timeline: []
    };

    // Normalize country names to some degree or just use exact matches
    const setA = new Set(sideA.map(c => c.toLowerCase()));
    const setB = new Set(sideB.map(c => c.toLowerCase()));

    const brokenLinks = [];

    tradeData.forEach(link => {
        const source = link.source.toLowerCase();
        const target = link.target.toLowerCase();

        // If one is in sideA and other in sideB (or vice versa), trade is "cut"
        const isCut = (setA.has(source) && setB.has(target)) || (setB.has(source) && setA.has(target));

        if (isCut) {
            // Parse value: "$130 Billion" -> 130
            const valueMatch = link.value.match(/\$?([\d\.]+)/);
            const value = valueMatch ? parseFloat(valueMatch[1]) : 0;
            
            consequences.totalTradeCut += value;
            brokenLinks.push(link);

            link.goods.forEach(good => {
                consequences.disruptedGoods[good] = (consequences.disruptedGoods[good] || 0) + value;
            });
        }
    });

    // Calculate Scores
    // 1. Total Trade Cut impact
    consequences.volatilityScore = Math.min(100, Math.round(consequences.totalTradeCut / 10)); // Arbitrary scaling
    
    // 2. Resource dependency impact
    const resourceWeight = {
        'Crude Oil': 2.5,
        'Natural Gas': 3.0,
        'Semiconductors': 4.0,
        'Wheat': 2.0,
        'Corn': 1.5,
        'LNG': 2.0
    };

    let resourcePenalty = 0;
    Object.keys(consequences.disruptedGoods).forEach(good => {
        if (resourceWeight[good]) {
            resourcePenalty += resourceWeight[good] * 5;
        }
    });

    consequences.volatilityScore = Math.min(100, consequences.volatilityScore + resourcePenalty);
    consequences.globalInflationImpact = (consequences.totalTradeCut / 500) + (resourcePenalty / 50);

    // Timeline Generation
    consequences.timeline = [
        { day: 1, event: 'Sanctions declared; global markets freeze.', impact: 'Energy prices spike +15%.' },
        { day: 7, event: 'Supply chains for electronics and automotive stall.', impact: 'Major factory closures across Group B.' },
        { day: 30, event: 'Secondary inflation wave; food prices rise sharply.', impact: 'Global cost of living up 8%.' },
        { day: 180, event: 'Strategic resource depletion; deep industrial recession.', impact: 'Global GDP projected -4.2%.' }
    ];

    res.json({
        parameters: { sideA, sideB },
        results: consequences,
        brokenLinks
    });
};

module.exports = { simulateCrisis };
