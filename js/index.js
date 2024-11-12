import { clamp } from './utils.js';
import ProductManager from './ProductManager.js';
import FlavorsManager from './FlavorManager.js';

Promise.all([
  d3.json("data/nutriforge.json")]).then(([data]) => {

  let height = 500;
  let width = 1000;

  const nodes = Array.from(new Set(data.links.flatMap(link => [link.source, link.target])))
            .map(id => ({ id }));

  const flavorManager = new FlavorsManager("data/tasteprofiles.json");
  flavorManager.loadTasteProfiles();
  const productManager = new ProductManager("#recipe-list", flavorManager);

  let currentNode = null;
  let activatedNodes = [];

  function addCurrentNode(currentNode) {
    if (!activatedNodes.includes(currentNode)) {
        activatedNodes.push(currentNode);
    }
    productManager.addProduct(currentNode);
    updateGraph(activatedNodes);
  }

  function removeCurrentNode(currentNode) {
    const index = activatedNodes.indexOf(currentNode);
    if (index !== -1) {
      productManager.removeProduct(currentNode);
    }
    console.log(activatedNodes);
  }

  //Search of the product and highlight it on graph
  d3.select("#search-btn").on("click", function() {
    currentNode = d3.select("#input-box").property("value");
    console.log(currentNode)
    highlightCurrentNode(currentNode);
    addCurrentNode(currentNode);

    d3.select("#input-box").property("value", "");
  });

  var node = d3.select("svg").selectAll("circle")
                              .data(nodes).enter()
                              .append("circle")
                              .attr("r", 12)
                              .classed("node", true)
                              .classed("fixed", d => d.fx != undefined)
                              .on("mouseover", function (event, d) {
                                  // Збільшуємо розмір при наведенні
                                  d3.select(this).transition()
                                    .duration(200)
                                    .attr("r", 15); // Новий радіус

                                    d3.select(`#label-${d.id.replace(/\s+/g, "_")}`).style("visibility", "visible");
                                })
                                .on("mouseout", function (event, d) {
                                  // Повертаємо початковий розмір при відведенні миші
                                  d3.select(this).transition()
                                    .duration(200)
                                    .attr("r", 12); // Початковий радіус
                                    if (!d.fx) {
                                      d3.select(`#label-${d.id.replace(/\s+/g, "_")}`).style("visibility", "hidden");
                                    }
                                  });

  var link = d3.select("svg").selectAll("line")
                              .data(data.links)
                              .enter()
                              .append("line")
                              .attr("stroke", "orange")
                              .classed("link", true)

    // Додавання тексту для нодів
  var labels = d3.select("svg").selectAll(".label")
                              .data(nodes).enter()
                              .append("text")
                              .attr("class", "label")
                              .attr("id", d => `label-${d.id.replace(/\s+/g, "_")}`)
                              .attr("x", d => (d.x !== undefined ? d.x + 15 : 0))
                              .attr("y", d => (d.y !== undefined ? d.y - 15 : 0))
                              .text(d => {
                              //  console.log(d.id);
                                return d.id;
                              })
                              .style("visibility", d => activatedNodes.map(node => node.trim()).includes(d.id.trim()) ? "visible" : "hidden");

  node.raise();
  labels.raise();

  const simulation = d3.forceSimulation(nodes)
                      .force("link", d3.forceLink(data.links).id(d => d.id)) 
                      .force("charge", d3.forceManyBody())
                      .force("center", d3.forceCenter(500, 250))
                      .on("tick", ticked);
                    
  const drag = d3.drag()
                  .on("start", dragstart)
                  .on("drag", dragged);

  node.call(drag).on("click", click);

  function ticked() {
    node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

    labels
    .attr("x", d => d.x + 15)
    .attr("y", d => d.y - 15);

      link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

  }
  function click(event, d) {
    // Якщо вузол вже фіксований, то розфіксовуємо його
    currentNode = d.id;

    if (d.fx !== undefined) {
      delete d.fx;
      delete d.fy;
      d3.select(this).classed("fixed", false);
      d3.select(`#label-${d.id.replace(/\s+/g, "_")}`).style("visibility", "hidden"); // Приховуємо текст при розфіксації
      removeCurrentNode(currentNode);
    } else {
      // Якщо не фіксований, фіксуємо його на поточній позиції
      d.fx = d.x;
      d.fy = d.y;
      d3.select(this).classed("fixed", true);
      d3.select(`#label-${d.id.replace(/\s+/g, "_")}`).style("visibility", "visible"); // Залишаємо текст видимим
      addCurrentNode(currentNode);
    }
    simulation.alpha(1).restart();
  }

  function dragstart() {
    d3.select(this).classed("fixed", true);
  }

  function dragged(event, d) {
    d.fx = clamp(event.x, 0, width);
    d.fy = clamp(event.y, 0, height);
    simulation.alpha(1).restart();
  }


  function highlightCurrentNode(currentNode) {                                  
    d3.selectAll("circle")
      .filter(d => d.id === currentNode)
      .classed("fixed", true);
  
    d3.select(`#label-${currentNode.replace(/\s+/g, "_")}`)
      .style("visibility", "visible");
  }
  
  function updateGraph(activatedNodes) {
    // Фільтруємо зв'язки, які мають source або target у selectedNodes
    const filteredLinks = data.links.filter(link => 
      activatedNodes.includes(link.source.id) || activatedNodes.includes(link.target.id)
    );
  
    // Створюємо множину всіх вузлів, які з'єднані з вузлами у selectedNodes
    const connectedNodes = new Set(filteredLinks.flatMap(link => [link.source.id, link.target.id]));
  
    // Додаємо обрані вузли до connectedNodes, щоб вони залишалися видимими
    nodes.forEach(nodeId => connectedNodes.add(nodeId));
  
    // Оновлюємо видимість вузлів
    node
      .style("opacity", d => connectedNodes.has(d.id) ? 1 : 0); // Приховуємо не пов'язані вузли
  
    // Оновлюємо видимість зв'язків
    link
      .style("opacity", d => (activatedNodes.includes(d.source.id) || activatedNodes.includes(d.target.id)) ? 1 : 0);
  }

});