const coverageSummary = require('../coverage/coverage-summary.json');
const fs = require('fs');

const THRESHOLD = 80;

const statistics = Object.entries(coverageSummary.total).map(([measure, { pct }]) => ({ measure, pct })).filter(({pct}) => typeof pct === 'number');

/**
 * @param {string} string 
 */
function titleCase(string) {
    return string.replace(/^\w|\s\w/g, (m) => m.toLocaleUpperCase()).replace(/(\w)(\w+)/g, (_, p, m) => p + m.toLocaleLowerCase());
}

/**
 * @param {string} template 
 * @param {Record<string, string>} variables 
 */
function renderTemplate(template, variables) {
    return template.replace(/\{\{ (\w+) \}\}/g, (_, key) => {
        return variables[key];
    });
}

/**
 * @param {{ pct: number, measure: string }} statistic 
 */
function renderBadge(statistic) {
    const template = fs.readFileSync('./assets/badge.svg').toString();
    const meetsThreshold = statistic.pct > THRESHOLD;
    return renderTemplate(template, {
        statistic: titleCase(statistic.measure),
        percentage: statistic.pct,
        fontColor: meetsThreshold ? '#000' : '#fff',
        stroke: meetsThreshold ? '#188300' : '#DC1C13',
        gradient: meetsThreshold ? 'greenGradient' : 'redGradient',
    });
}

for (const statistic of statistics) {
    const badge = renderBadge(statistic);
    fs.writeFileSync(`./coverage/${statistic.measure}.svg`, badge);
}
