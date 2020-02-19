const chartSize = { width: 1200, height: 650 };
const margin = { left: 100, right: 10, top: 10, botttom: 150 };
const width = chartSize.width - (margin.left + margin.right);
const height = chartSize.height - (margin.top + margin.botttom);
const c = d3.scaleOrdinal(d3.schemeCategory10);

const initChart = () => {
  const svg = d3.select('#chart-area').append('svg')
    .attr('height', chartSize.height)
    .attr('width', chartSize.width);

  const timeG = svg.append('g')
    .attr('class', 'quotes')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xlabel = timeG.append('text')
    .attr('class', 'x axis-label')
    .attr('x', width / 2)
    .attr('y', height + 140)
    .text('TIME');

  const ylabel = timeG.append('text')
    .attr('class', 'y axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(height / 2))
    .attr('y', -60)
    .text('CLOSE');

  timeG.append('g')
    .attr('class', 'y axis');

  timeG.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`);

  timeG.selectAll('.x.axis text')
    .attr('transform', 'rotate(-40)')
    .attr('x', -5)
    .attr('y', 10);

  timeG.append("path")
    .attr('class', 'close');

  timeG.append("path")
    .attr('class', 'sma')
}

const updateChart = (quotes) => {
  const svg = d3.select('#chart-area svg');
  const filtered_quotes = _.filter(quotes, "SMA");
  const maxSma = _.maxBy(filtered_quotes, "SMA").SMA;
  const minSma = _.minBy(filtered_quotes, "SMA").SMA;
  const minClose = _.minBy(quotes, "Close").Close;
  const maxClose = _.maxBy(quotes, "Close").Close;

  const y = d3.scaleLinear()
    .domain([Math.min(minSma, minClose), Math.max(maxSma, maxClose)])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y).ticks(10);

  svg.select('.y.axis').call(yAxis);

  const x = d3.scaleTime()
    .domain([new Date(_.first(quotes).Date), new Date(_.last(quotes).Date)])
    .range([0, width]);
  const xAxis = d3.axisBottom(x);
  svg.select('.x.axis').call(xAxis);
  const line = d3.line().x(q => x(q.Time)).y(q => y(q.Close))
  const line1 = d3.line().x(q => x(q.Time)).y(q => y(q.SMA));
  d3.select(".close").attr('d', line(quotes))
  d3.select(".sma").attr('d', line1(_.filter(quotes, "SMA")))
}

const parseData = function ({ AdjClose, Volume, Date, ...numerics }) {
  _.forEach(numerics, (v, k) => numerics[k] = +v)
  const date = new window.Date(Date)
  return { Date, Time: date, ...numerics }
}

const getAverage = function (data) {
  let sum = 0;
  _.forEach(_.takeRight(data, 100), (obj => sum += obj.Close));
  return sum / 100;
}

const analyseData = function (quotes) {
  const data = quotes.slice(0);
  while (data.length > 100) {
    quotes[data.length - 1]["SMA"] = getAverage(data);
    data.pop();
  }
  return quotes;
}

const startVisualization = (niftyData) => {
  const analysedData = analyseData(niftyData);
  initChart();
  updateChart(analysedData);
  const dataToBeModified = analysedData.slice(0);
  const slider = createD3RangeSlider(0, analysedData.length - 1, "#slider-container");
  slider.range(0, analysedData.length - 1);
  slider.onChange((newRange) => {
    updateChart(dataToBeModified.slice(newRange.begin, newRange.end));
  })
}

const main = () => {
  d3.csv('data/Nifty.csv', parseData).then(startVisualization);
}

window.onload = main;