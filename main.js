var tooltip = d3.select('body')
    .append('div').classed('tooltip', true);
tooltip.append('div')
    .attr('class', 'sector');
tooltip.append('div')
    .attr('class', 'change_p');
tooltip.append('div')
    .attr('class', 'index_points');
tooltip.append('div')
    .attr('class', 'weight_p');
tooltip.append('div')
    .attr('class', 'market_cap');

const path = g.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr('fill', function(d, i, value) {
        if (d.data.points == 0) {
            return '#84C58'
        } else if (d.data.points < 0 && d.data.points > -2.5) {

            return '#5C0808'
        } else if (d.data.points < -2.5 && d.data.points > -5) {

            return '#A00C0C'
        } else if (d.data.points < -5 && d.data.points > -20) {

            return '#DD2E2E'
        } else if (d.data.points > 0 && d.data.points < 2.5) {

            return '#188518'
        } else if (d.data.points > 2.5 && d.data.points < 5) {
            return '#519B57'
        } else if (d.data.points > 5 && d.data.points < 20) {
            return '#63C668'
        } else if (d.data.points > 20) {
            return '#2F912F'
        } else if (d.data.points < -20) {
            return '#6C2020'
        }

    })
    .attr("fill-opacity", d => arcVisible(d.current) ? (d.value ? 1 : 1) : 1)
    .attr("d", d => arc(d.current))
    .text((d => d.data.value < 1.4 ? ' ' : d.data.name))
    .text((d => d.value < 1.4 ? ' ' : d.data.name))
    .on('mouseover', function(d) {
        var total = d.parent.value;
        var market_cap = d.parent.data.marketcap;
        var percent = Math.round(1000 * d.value / total) / 10; // calculate percent
        tooltip.select('.sector').html(d.data.name); // set current label
        tooltip.select('.change_p').html(d.data.market_change_p); // set current count
        tooltip.select('.index_points').html(d.data.data[0].indexpoints); // set percent calculated above
        tooltip.select('.weight_p').html(d.data.weightage + "%");
        tooltip.select('.market_cap').html(d.data.data[0].marketcap);
        tooltip.style('display', 'block'); // set display
    })
    .on('mouseout', function() { // when mouse leaves div
        tooltip.style('display', 'none'); // hide tooltip for that element
    })
    .on('mousemove', function(d) { // when mouse moves
        tooltip.style('top', (d3.event.layerY + 10) + 'px'); // always 10px below the cursor
        tooltip.style('left', (d3.event.layerX + 10) + 'px'); // always 10px to the right of the mouse
    });


path.filter(d => d.children)
    .style("cursor", "pointer")
    .on("click", clicked);


path.append("title")
    .text(d => `${d.ancestors().map(d => d.data.name)
        .reverse().join(">")}: ${parseFloat(d.data.points).toFixed(2)}\nMarketcap: Rs ${format(d.data.marketcap)} \nWeightage: ${parseFloat(d.value).toFixed(2)}%\nVolume: ${(d.data.stock_volume)}

                        `)

path.append("info")
    .text(d => `${d.ancestors().map(d => d.data.size).reverse().join("/")} \n${format(d.value)} `)
