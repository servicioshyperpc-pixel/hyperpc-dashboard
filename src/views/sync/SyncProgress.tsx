import React from 'react';
import { Card } from '../../core/components/Card.tsx';
import { Badge } from '../../core/components/Badge.tsx';
import { Button } from '../../core/components/Button.tsx';
import {
  CheckCircle,
  XCircle,
  Loader,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface SyncStep {
  id: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending' | 'error';
  message?: string;
  duration?: string;
}

interface SyncProgressProps {
  title?: string;
  steps: SyncStep[];
  overallProgress: number;
  currentStepId?: string;
  isActive: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
}

const STATUS_CONFIG = {
  completed: {
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    lineColor: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
  },
  in_progress: {
    icon: <Loader className="w-5 h-5 text-orange-500 animate-spin" />,
    lineColor: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  pending: {
    icon: <Clock className="w-5 h-5 text-gray-400" />,
    lineColor: 'bg-gray-200',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    lineColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
  },
};

export const SyncProgress: React.FC<SyncProgressProps> = ({
  title = 'Sincronización en Progreso',
  steps,
  overallProgress,
  isActive,
  onCancel,
  onRetry,
}) => {
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const errorSteps = steps.filter(s => s.status === 'error').length;
  const hasErrors = errorSteps > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">
            {isActive 
              ? `Sincronizando... ${completedSteps} de ${steps.length} pasos completados`
              : hasErrors 
                ? `Sincronización completada con ${errorSteps} error(es)`
                : 'Sincronización completada exitosamente'
            }
          </p>
        </div>
        {!isActive && hasErrors && onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        )}
      </div>

      {/* Progress Overview */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Progreso General</span>
            <span className="text-sm font-semibold text-gray-900">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                hasErrors ? 'bg-red-500' : 'bg-orange-600'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                {completedSteps} completados
              </span>
              {errorSteps > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />
                  {errorSteps} errores
                </span>
              )}
            </div>
            <span className="text-gray-500">{steps.length} pasos totales</span>
          </div>
        </div>
      </Card>

      {/* Steps Timeline */}
      <Card header={<h3 className="font-semibold text-gray-900">Pasos de Sincronización</h3>}>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = STATUS_CONFIG[step.status];
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.id} className="relative">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${status.bgColor} flex items-center justify-center`}>
                    {status.icon}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${status.textColor}`}>{step.label}</p>
                        {step.message && (
                          <p className="text-sm text-gray-500 mt-0.5">{step.message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {step.duration && (
                          <span className="text-xs text-gray-400">{step.duration}</span>
                        )}
                        <Badge 
                          variant={
                            step.status === 'completed' ? 'success' :
                            step.status === 'in_progress' ? 'info' :
                            step.status === 'error' ? 'error' :
                            'default'
                          }
                        >
                          {step.status === 'completed' ? 'Completado' :
                           step.status === 'in_progress' ? 'En progreso' :
                           step.status === 'error' ? 'Error' :
                           'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {!isLast && (
                  <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Cancel Button */}
      {isActive && onCancel && (
        <div className="flex justify-end">
          <Button variant="danger" onClick={onCancel}>
            <XCircle className="w-4 h-4 mr-2" />
            Cancelar Sincronización
          </Button>
        </div>
      )}
    </div>
  );
};

export default SyncProgress;
