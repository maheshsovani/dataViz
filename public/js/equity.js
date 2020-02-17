const chartSize = { width: 800, height: 600 };
const margin = { left: 100, right: 10, top: 10, botttom: 150 };
const width = chartSize.width - (margin.left + margin.right);
const height = chartSize.height - (margin.top + margin.botttom);
const c = d3.scaleOrdinal(d3.schemeCategory10);

const initChart = () => {
  const svg = d3.select('#chart-area').append('svg')
    .attr('height', chartSize.height)
    .attr('width', chartSize.width);

  const timeG = svg.append('g')
    .attr('class', 'prices')
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
    .text('PRICES');

  timeG.append('g')
    .attr('class', 'y axis');

  timeG.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`);

  timeG.selectAll('.x.axis text')
    .attr('transform', 'rotate(-40)')
    .attr('x', -5)
    .attr('y', 10)
}

const updateChart = (prices) => {
  const svg = d3.select('#chart-area svg');
  const svgGroup = d3.select('.prices');

  const y = d3.scaleLinear()
    .domain([_.minBy(prices, "Close").Close, _.maxBy(prices, "Close").Close])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y).ticks(10);

  svg.select('.y.axis').call(yAxis);

  const x = d3.scaleTime()
    .domain([new Date(_.first(prices).Date), new Date(_.last(prices).Date)])
    .range([0, width]);

  const xAxis = d3.axisBottom(x);
  svg.select('.x.axis').call(xAxis);
}

const parseData = function ({ AdjClose, Volume, Date, ...numerics }) {
  _.forEach(numerics, (v, k) => numerics[k] = +v)
  return { Date, ...numerics }
}

const startVisualization = (data) => {
  initChart()
  updateChart(data)
}


const main = () => {
  d3.csv('data/Nifty.csv', parseData).then(startVisualization);
}

window.onload = main;