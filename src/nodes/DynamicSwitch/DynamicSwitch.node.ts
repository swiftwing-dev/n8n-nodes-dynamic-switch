import type { IExecuteFunctions, INodeExecutionData, INodeParameters, INodeType, INodeTypeDescription, NodeParameterValue } from 'n8n-workflow';
import { NodeOperationError, NodeConnectionType } from 'n8n-workflow';

export class DynamicSwitch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Dynamic Switch',
		name: 'multiRouteSwitch',
		group: ['transform'],
		version: 1,
		icon: 'file:dynamic-switch.svg',
		description: 'Single-node switch with dynamic outputs and efficient routing',
		defaults: {
			name: 'Dynamic Switch',
		},
		inputs: [NodeConnectionType.Main],

		// Render dynamic outputs based on "numberOfOutputs".
		// @ts-ignore - Expression string is evaluated by n8n at runtime
		outputs: `={{Array(Math.max(1, Math.min($parameter.numberOfOutputs ?? 2, 50))).fill('main')}}`,

		// Output port labels (custom labels if provided, otherwise Route 0..N).
		// @ts-ignore - Expression string is evaluated by n8n at runtime
		outputNames: `={{(() => {
			const count = Math.max(1, Math.min($parameter.numberOfOutputs ?? 2, 50));
			const labelsRaw = ($parameter.outputLabels ?? '').toString();
			const labels = labelsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, count);
			if (labels.length === count) return labels;
			return Array.from({ length: count }, (_, i) => 'Route ' + i);
		})()}}`,

		properties: [
			{
				displayName: 'Number of Outputs',
				name: 'numberOfOutputs',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 50 },
				default: 2,
				description: 'How many output branches (ports) to create. Outputs are zero-indexed.',
			},
			{
				displayName: 'Output Labels',
				name: 'outputLabels',
				type: 'string',
				default: '',
				placeholder: 'Comma-separated, e.g. "Cold, Warm, Hot"',
				description: 'Optional custom labels for each output (comma-separated).',
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'Expression',
						value: 'expression',
						description: 'Send item to the output index resolved by an expression',
					},
					{
						name: 'Rules',
						value: 'rules',
						description: 'Send item to the output(s) whose rule(s) match',
					},
				],
				default: 'rules',
				description: 'How to determine the target output for each incoming item.',
			},

			// -----------------------------
			// Mode: Expression
			// -----------------------------
			{
				displayName: 'Output Index',
				name: 'expressionOutput',
				type: 'number',
				typeOptions: { minValue: 0 },
				displayOptions: { show: { mode: ['expression'] } },
				default: 0,
				description:
					'Zero-based output index to send each item to. Expressions are supported, e.g. {{$json.priority}}.',
			},

			// -----------------------------
			// Mode: Rules — Shared controls
			// -----------------------------
			{
				displayName: 'Data Type',
				name: 'dataType',
				type: 'options',
				options: [
					{ name: 'Boolean', value: 'boolean' },
					{ name: 'Date & Time', value: 'dateTime' },
					{ name: 'Number', value: 'number' },
					{ name: 'String', value: 'string' },
				],
				displayOptions: { show: { mode: ['rules'] } },
				default: 'number',
				description: 'Type of data to compare in routing rules.',
			},
			{
				displayName: 'Match Strategy',
				name: 'matchStrategy',
				type: 'options',
				options: [
					{ name: 'First Match', value: 'first' },
					{ name: 'All Matches', value: 'all' },
				],
				default: 'first',
				description: 'Whether to send to the first matching rule or to all matching rules.',
				displayOptions: { show: { mode: ['rules'] } },
			},

			// -----------------------------
			// Data type: boolean
			// -----------------------------
			{
				displayName: 'Left Value',
				name: 'value1',
				type: 'boolean',
				displayOptions: { show: { dataType: ['boolean'], mode: ['rules'] } },
				default: false,
			},
			{
				displayName: 'Routing Rules',
				name: 'rulesCollection',
				placeholder: 'Add Rule',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { dataType: ['boolean'], mode: ['rules'] } },
				default: {},
				options: [
					{
						name: 'rules',
						displayName: 'Boolean',
						values: [
							{
								displayName: 'Operation',
								name: 'operation',
								type: 'options',
								options: [
									{ name: 'Equal', value: 'equal' },
									{ name: 'Not Equal', value: 'notEqual' },
								],
								default: 'equal',
							},
							{
								displayName: 'Right Value',
								name: 'value2',
								type: 'boolean',
								default: false,
							},
							{
								displayName: 'Output',
								name: 'output',
								type: 'number',
								typeOptions: { minValue: 0 },
								default: 0,
								description: 'Index of the output to send matching items to.',
							},
						],
					},
				],
			},

			// -----------------------------
			// Data type: dateTime
			// -----------------------------
			{
				displayName: 'Left Value',
				name: 'value1',
				type: 'dateTime',
				displayOptions: { show: { dataType: ['dateTime'], mode: ['rules'] } },
				default: '',
			},
			{
				displayName: 'Routing Rules',
				name: 'rulesCollection',
				placeholder: 'Add Rule',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { dataType: ['dateTime'], mode: ['rules'] } },
				default: {},
				options: [
					{
						name: 'rules',
						displayName: 'Dates',
						values: [
							{
								displayName: 'Operation',
								name: 'operation',
								type: 'options',
								options: [
									{ name: 'Occurred After', value: 'after' },
									{ name: 'Occurred Before', value: 'before' },
								],
								default: 'after',
							},
							{
								displayName: 'Right Value',
								name: 'value2',
								type: 'dateTime',
								default: '',
							},
							{
								displayName: 'Output',
								name: 'output',
								type: 'number',
								typeOptions: { minValue: 0 },
								default: 0,
							},
						],
					},
				],
			},

			// -----------------------------
			// Data type: number
			// -----------------------------
			{
				displayName: 'Left Value',
				name: 'value1',
				type: 'number',
				displayOptions: { show: { dataType: ['number'], mode: ['rules'] } },
				default: 0,
			},
			{
				displayName: 'Routing Rules',
				name: 'rulesCollection',
				placeholder: 'Add Rule',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { dataType: ['number'], mode: ['rules'] } },
				default: {},
				options: [
					{
						name: 'rules',
						displayName: 'Numbers',
						values: [
							{
								displayName: 'Operation',
								name: 'operation',
								type: 'options',
								options: [
									{ name: 'Smaller', value: 'smaller' },
									{ name: 'Smaller Equal', value: 'smallerEqual' },
									{ name: 'Equal', value: 'equal' },
									{ name: 'Not Equal', value: 'notEqual' },
									{ name: 'Larger', value: 'larger' },
									{ name: 'Larger Equal', value: 'largerEqual' },
								],
								default: 'equal',
							},
							{
								displayName: 'Right Value',
								name: 'value2',
								type: 'number',
								default: 0,
							},
							{
								displayName: 'Output',
								name: 'output',
								type: 'number',
								typeOptions: { minValue: 0 },
								default: 0,
							},
						],
					},
				],
			},

			// -----------------------------
			// Data type: string
			// -----------------------------
			{
				displayName: 'Left Value',
				name: 'value1',
				type: 'string',
				displayOptions: { show: { dataType: ['string'], mode: ['rules'] } },
				default: '',
			},
			{
				displayName: 'Case Insensitive',
				name: 'caseInsensitive',
				type: 'boolean',
				default: true,
				description: 'Ignore case when comparing strings (except regex).',
				displayOptions: { show: { dataType: ['string'], mode: ['rules'] } },
			},
			{
				displayName: 'Routing Rules',
				name: 'rulesCollection',
				placeholder: 'Add Rule',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				displayOptions: { show: { dataType: ['string'], mode: ['rules'] } },
				default: {},
				options: [
					{
						name: 'rules',
						displayName: 'Strings',
						values: [
							{
								displayName: 'Operation',
								name: 'operation',
								type: 'options',
								options: [
									{ name: 'Contains', value: 'contains' },
									{ name: 'Not Contains', value: 'notContains' },
									{ name: 'Ends With', value: 'endsWith' },
									{ name: 'Not Ends With', value: 'notEndsWith' },
									{ name: 'Equal', value: 'equal' },
									{ name: 'Not Equal', value: 'notEqual' },
									{ name: 'Regex Match', value: 'regex' },
									{ name: 'Regex Not Match', value: 'notRegex' },
									{ name: 'Starts With', value: 'startsWith' },
									{ name: 'Not Starts With', value: 'notStartsWith' },
								],
								default: 'equal',
							},
							{
								displayName: 'Right Value',
								name: 'value2',
								type: 'string',
								displayOptions: { hide: { operation: ['regex', 'notRegex'] } },
								default: '',
							},
							{
								displayName: 'Regex',
								name: 'value2',
								type: 'string',
								displayOptions: { show: { operation: ['regex', 'notRegex'] } },
								default: '',
								placeholder: '/text/i',
							},
							{
								displayName: 'Output',
								name: 'output',
								type: 'number',
								typeOptions: { minValue: 0 },
								default: 0,
							},
						],
					},
				],
			},

			// Fallback (both modes)
			{
				displayName: 'Fallback Output',
				name: 'fallbackOutput',
				type: 'number',
				typeOptions: { minValue: -1 },
				default: -1,
				description:
					'Output index for items that did not match any rule (Rules mode) or invalid index (Expression mode). Use -1 to drop non-matching items.',
				displayOptions: { show: { mode: ['rules', 'expression'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const numberOfOutputs = (this.getNodeParameter('numberOfOutputs', 0) as number) ?? 2;
		const outputs: INodeExecutionData[][] = Array.from(
			{ length: Math.max(1, Math.min(numberOfOutputs, 50)) },
			() => [],
		);

		const mode = this.getNodeParameter('mode', 0) as string;

		const ops: Record<string, (v1: NodeParameterValue, v2: NodeParameterValue) => boolean> = {
			after: (v1, v2) => (v1 as number) > (v2 as number),
			before: (v1, v2) => (v1 as number) < (v2 as number),
			contains: (v1, v2) => (v1 ?? '').toString().includes((v2 ?? '').toString()),
			notContains: (v1, v2) => !(v1 ?? '').toString().includes((v2 ?? '').toString()),
			endsWith: (v1, v2) => (v1 as string).endsWith(v2 as string),
			notEndsWith: (v1, v2) => !(v1 as string).endsWith(v2 as string),
			equal: (v1, v2) => v1 === v2,
			notEqual: (v1, v2) => v1 !== v2,
			larger: (v1, v2) => (Number(v1) || 0) > (Number(v2) || 0),
			largerEqual: (v1, v2) => (Number(v1) || 0) >= (Number(v2) || 0),
			smaller: (v1, v2) => (Number(v1) || 0) < (Number(v2) || 0),
			smallerEqual: (v1, v2) => (Number(v1) || 0) <= (Number(v2) || 0),
			startsWith: (v1, v2) => (v1 as string).startsWith(v2 as string),
			notStartsWith: (v1, v2) => !(v1 as string).startsWith(v2 as string),
			regex: (v1, v2) => {
				const match = (v2 ?? '').toString().match(new RegExp('^/(.*?)/([gimusy]*)$'));
				let regex: RegExp;
				if (!match) regex = new RegExp((v2 ?? '').toString());
				else if (match.length === 1) regex = new RegExp(match[1]);
				else regex = new RegExp(match[1], match[2]);
				return !!(v1 ?? '').toString().match(regex);
			},
			notRegex: (v1, v2) => {
				const match = (v2 ?? '').toString().match(new RegExp('^/(.*?)/([gimusy]*)$'));
				let regex: RegExp;
				if (!match) regex = new RegExp((v2 ?? '').toString());
				else if (match.length === 1) regex = new RegExp(match[1]);
				else regex = new RegExp(match[1], match[2]);
				return !(v1 ?? '').toString().match(regex);
			},
		};

		const parseDateValue = (v: NodeParameterValue): number => {
			if (typeof v === 'number') return v;
			if (typeof v === 'string') {
				const n = new Date(v).getTime();
				if (Number.isFinite(n)) return n;
			}
			// Try to parse as Date object (check if it has getTime method)
			if (v && typeof v === 'object' && 'getTime' in v && typeof (v as any).getTime === 'function') {
				const n = (v as any).getTime();
				if (Number.isFinite(n)) return n;
			}
			throw new NodeOperationError(this.getNode(), `Invalid DateTime value: "${v as string}"`);
		};

		const ensureRange = (idx: number) => {
			if (!Number.isInteger(idx) || idx < 0 || idx >= outputs.length) {
				throw new NodeOperationError(
					this.getNode(),
					`Output index ${idx} is out of range. Must be between 0 and ${outputs.length - 1}.`,
				);
			}
		};

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			try {
				if (mode === 'expression') {
					let target = this.getNodeParameter('expressionOutput', i) as number;
					target = Math.floor(target);

					if (target < 0 || target >= outputs.length) {
						const fb = this.getNodeParameter('fallbackOutput', i) as number;
						if (fb !== -1) {
							ensureRange(Math.floor(fb));
							outputs[Math.floor(fb)].push(item);
						}
					} else {
						ensureRange(target);
						outputs[target].push(item);
					}
					continue;
				}

				// mode === 'rules'
				const dataType = this.getNodeParameter('dataType', i) as string;
				const matchStrategy = (this.getNodeParameter('matchStrategy', i) as string) || 'first';

				let left: NodeParameterValue = this.getNodeParameter('value1', i) as NodeParameterValue;

				if (dataType === 'dateTime') {
					left = parseDateValue(left);
				}

				const rules = this.getNodeParameter('rulesCollection.rules', i, []) as INodeParameters[];
				let matched = false;

				for (const rule of rules) {
					let right: NodeParameterValue = rule.value2 as NodeParameterValue;
					if (dataType === 'dateTime') {
						right = parseDateValue(right);
					}

					// Normalize for case-insensitive string comparisons (except regex).
					let l = left;
					let r = right;
					const op = rule.operation as string;
					if (dataType === 'string') {
						const ci = this.getNodeParameter('caseInsensitive', i, true) as boolean;
						const isRegex = op === 'regex' || op === 'notRegex';
						if (ci && !isRegex) {
							l = (l ?? '').toString().toLowerCase();
							r = (r ?? '').toString().toLowerCase();
						}
					}

					const fn = ops[op];
					if (typeof fn !== 'function') {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${op}`);
					}
					const ok = fn(l, r);

					if (ok) {
						const outIdx = Math.floor(rule.output as number);
						ensureRange(outIdx);
						outputs[outIdx].push(item);
						matched = true;
						if (matchStrategy === 'first') break;
					}
				}

				if (!matched) {
					const fb = this.getNodeParameter('fallbackOutput', i) as number;
					if (fb !== -1) {
						const outIdx = Math.floor(fb);
						ensureRange(outIdx);
						outputs[outIdx].push(item);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					outputs[0].push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return outputs;
	}
}